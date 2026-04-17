import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Layout, 
  List, 
  Plus, 
  Clock, 
  AlertCircle 
} from "lucide-react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { format, isBefore, startOfDay } from "date-fns";

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      const q = query(collection(db, "maintenanceRequests"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const filtered = requests.filter(r => 
    r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.equipmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading request records...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Records</h1>
          <p className="text-slate-500 font-medium">Log and history of all activities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 p-1">
            <Link to="/requests" className="px-3 py-1.5 text-slate-500 hover:text-slate-900 rounded-lg text-xs font-bold flex items-center gap-2">
              <Layout className="h-3.5 w-3.5" /> Kanban
            </Link>
            <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-2">
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
          <Link 
            to="/requests/new" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
          >
            <Plus className="h-5 w-5" /> New Request
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filter by subject or asset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-slate-700"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-slate-500 font-bold text-xs hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
            <Filter className="h-4 w-4" /> Filters <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Subject & Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Asset</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Scheduled</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Stage</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Work Hours</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(req => {
                const isOverdue = req.scheduledDate && 
                               isBefore(new Date(req.scheduledDate), startOfDay(new Date())) && 
                               !["Repaired", "Scrap"].includes(req.stage);

                return (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-all">{req.subject}</span>
                        <span className={`text-[10px] font-bold mt-1 uppercase ${
                          req.type === "Preventive" ? "text-blue-500" : "text-amber-500"
                        }`}>
                          {req.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">
                      {req.equipmentName || "Unknown"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className={`h-3.5 w-3.5 ${isOverdue ? 'text-red-500' : 'text-slate-300'}`} />
                        <span className={`text-sm font-bold ${isOverdue ? 'text-red-500' : 'text-slate-600'}`}>
                          {req.scheduledDate ? format(new Date(req.scheduledDate), "MMM dd, yyyy") : "N/A"}
                        </span>
                        {isOverdue && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        req.stage === "Repaired" ? "bg-green-50 text-green-600 border border-green-100" :
                        req.stage === "In Progress" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                        req.stage === "Scrap" ? "bg-red-50 text-red-600 border border-red-100" :
                        "bg-slate-50 text-slate-400 border border-slate-100"
                      }`}>
                        {req.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">
                      {req.hoursSpent ? `${req.hoursSpent}h` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/requests/${req.id}`} className="text-blue-600 font-bold text-xs hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-medium">No records match your filters.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestList;
