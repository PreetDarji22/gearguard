import React, { useEffect, useState } from "react";
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Plus, 
  Calendar as CalendarIcon, 
  List, 
  Layout, 
  Clock, 
  User, 
  AlertCircle,
  MoreHorizontal,
  X
} from "lucide-react";
import { collection, query, getDocs, updateDoc, doc, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { format, isBefore, startOfDay } from "date-fns";
import CalendarView from "./CalendarView";
import RequestList from "./RequestList";
import { useAuth } from "../../context/AuthContext";

const STAGES = ["New", "In Progress", "Repaired", "Scrap"];

const KanbanCard = ({ request, isOverlay }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: request.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = request.scheduledDate && 
                   isBefore(new Date(request.scheduledDate), startOfDay(new Date())) && 
                   !["Repaired", "Scrap"].includes(request.stage);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white p-4 rounded-2xl border-l-4 shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group ${
        isOverdue ? "border-red-500" : 
        request.type === "Preventive" ? "border-blue-500" : "border-amber-500"
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
          request.type === "Preventive" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
        }`}>
          {request.type}
        </span>
        {isOverdue && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
            <AlertCircle className="h-3 w-3" /> OVERDUE
          </span>
        )}
      </div>
      
      <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 mb-2 truncate">
        {request.subject}
      </h4>
      
      <p className="text-xs text-slate-500 font-medium truncate mb-4">
        {request.equipmentName || "Unknown Equipment"}
      </p>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center border border-white">
            <User className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[80px]">
            {request.assignedTechnicianName || "Unassigned"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="h-3 w-3" />
          <span className="text-[10px] font-bold">
            {request.scheduledDate ? format(new Date(request.scheduledDate), "MMM d") : "No date"}
          </span>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn = ({ stage, requests }) => {
  const { setNodeRef } = useSortable({ id: stage });

  return (
    <div className="flex flex-col w-full min-w-[300px] bg-slate-100/50 rounded-3xl p-4 min-h-[600px]">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">{stage}</h3>
          <span className="bg-white px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-400 border border-slate-200">
            {requests.length}
          </span>
        </div>
        <button className="p-1 hover:bg-white rounded-lg transition-colors">
          <MoreHorizontal className="h-4 w-4 text-slate-400" />
        </button>
      </div>

      <SortableContext id={stage} items={requests.map(r => r.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1">
          {requests.map(req => (
            <KanbanCard key={req.id} request={req} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

const RequestBoard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [view, setView] = useState("kanban"); // kanban, calendar, list
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterEquipId = searchParams.get("equipmentId");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "maintenanceRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = async (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeReq = requests.find(r => r.id === active.id);
    const overId = over.id;

    // If "over" is a stage name
    if (STAGES.includes(overId) && activeReq.stage !== overId) {
      setRequests(prev => prev.map(r => r.id === active.id ? { ...r, stage: overId } : r));
      await updateDoc(doc(db, "maintenanceRequests", active.id), { stage: overId });
      
      // logic for scrapping equipment if stage is Scrap
      if (overId === "Scrap" && activeReq.equipmentId) {
        await updateDoc(doc(db, "equipment", activeReq.equipmentId), {
           isScraped: true,
           lastNote: `Marked as scrapped via request #${active.id} on ${new Date().toLocaleDateString()}`
        });
        toast.success("Equipment marked as scrapped.");
      }
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Initializing board...</div>;

  const filteredRequests = filterEquipId 
    ? requests.filter(r => r.equipmentId === filterEquipId)
    : requests;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Board</h1>
          <p className="text-slate-500 font-medium">Manage workflow and technicians</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                view === "kanban" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Layout className="h-3.5 w-3.5" /> Kanban
            </button>
            <button 
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                view === "calendar" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" /> Calendar
            </button>
            <button 
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                view === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          {isAdmin && (
            <Link 
              to="/requests/new" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" /> New Request
            </Link>
          )}
        </div>
      </div>

      {filterEquipId && (
        <div className="mb-6 flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold border border-blue-100">
          <AlertCircle className="h-4 w-4" />
          Filtering by Equipment ID: {filterEquipId}
          <button onClick={() => navigate("/requests")} className="ml-auto hover:text-blue-900"><X className="h-4 w-4" /></button>
        </div>
      )}

      {view === "kanban" && (
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-6 min-w-max">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {STAGES.map(stage => (
                <KanbanColumn 
                  key={stage} 
                  stage={stage} 
                  requests={filteredRequests.filter(r => r.stage === stage)} 
                />
              ))}
              
              <DragOverlay dropAnimation={{
                sideEffects: defaultDropAnimationSideEffects({
                  styles: {
                    active: {
                      opacity: '0.5',
                    },
                  },
                }),
              }}>
                {activeId ? (
                  <KanbanCard 
                    request={requests.find(r => r.id === activeId)} 
                    isOverlay 
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}

      {view === "calendar" && <CalendarView requests={filteredRequests} />}
      {view === "list" && <RequestList requests={filteredRequests} />}
    </div>
  );
};

export default RequestBoard;
