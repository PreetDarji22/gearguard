import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Wrench, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const RequestForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const preFilledDate = searchParams.get("date");
  const isNew = !id;
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    subject: "",
    type: "Corrective",
    equipmentId: "",
    equipmentCategory: "",
    teamId: "",
    assignedTechnicianId: "",
    stage: "New",
    scheduledDate: preFilledDate || "",
    hoursSpent: ""
  });
  
  const [equipmentList, setEquipmentList] = useState([]);
  const [teams, setTeams] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    if (!db) return;

    const fetchData = async () => {
      try {
        const [equipSnap, teamsSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "equipment")),
          getDocs(collection(db, "teams")),
          getDocs(collection(db, "users"))
        ]);
        
        setEquipmentList(equipSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTeams(teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTechnicians(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (!isNew) {
          const docSnap = await getDoc(doc(db, "maintenanceRequests", id));
          if (docSnap.exists()) {
            setFormData(docSnap.data());
            setOriginalData(docSnap.data());
          }
        }
      } catch (err) {
        toast.error("Error loading form data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isNew]);

  // AUTO-FILL LOGIC
  const handleEquipmentChange = (equipId) => {
    console.log("Selecting Equipment ID:", equipId);
    const equip = equipmentList.find(e => e.id === equipId);
    if (equip) {
      console.log("Auto-filling for equipment:", equip);
      setFormData(prev => ({
        ...prev,
        equipmentId: equipId,
        equipmentCategory: equip.department || "",
        teamId: equip.maintenanceTeamId || "",
        assignedTechnicianId: "" 
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        equipmentId: equipId,
        equipmentCategory: "",
        teamId: ""
      }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedEquip = equipmentList.find(e => e.id === formData.equipmentId);
      const payload = {
        ...formData,
        equipmentName: selectedEquip?.name || "",
        updatedAt: serverTimestamp()
      };

      let requestId = id;

      if (isNew) {
        payload.creatorId = user.uid; // Store creator ID for return notifications
        const docRef = await addDoc(collection(db, "maintenanceRequests"), {
          ...payload,
          createdAt: serverTimestamp()
        });
        requestId = docRef.id;
        toast.success("Maintenance request created!");
      } else {
        await updateDoc(doc(db, "maintenanceRequests", id), payload);
        toast.success("Maintenance request updated!");
      }

      // Check if technician was newly assigned
      const newlyAssigned = payload.assignedTechnicianId && 
        (isNew || payload.assignedTechnicianId !== originalData?.assignedTechnicianId);

      if (newlyAssigned) {
        await addDoc(collection(db, "notifications"), {
          recipientId: payload.assignedTechnicianId,
          senderId: user.uid,
          message: `You have been assigned to maintenance request: ${payload.subject}`,
          requestId: requestId,
          read: false,
          createdAt: serverTimestamp(),
          type: "request_assigned"
        });
      }

      navigate("/requests");
    } catch (err) {
      toast.error("Failed to save request");
    } finally {
      setSaving(false);
    }
  };

  // Filter technicians based on selected team
  const filteredTechnicians = formData.teamId 
    ? technicians.filter(tech => {
        const team = teams.find(t => t.id === formData.teamId);
        return team?.members?.includes(tech.id);
      })
    : [];

  if (loading) return <div className="p-8 text-center text-slate-500">Loading form...</div>;

  const isAdmin = user?.role === "admin";
  const isRepaired = formData.stage === "Repaired";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/requests")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Board
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-8 border-b border-slate-50 pb-4">
            {isNew ? "New Maintenance Request" : "Edit Request"}
          </h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                <input
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                  placeholder="Summarize the maintenance issue"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Maintenance Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Corrective", "Preventive"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider border-2 transition-all ${
                        formData.type === type 
                          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100" 
                          : "bg-slate-50 border-slate-100 text-slate-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Select Equipment</label>
                <select
                  required
                  value={formData.equipmentId}
                  onChange={(e) => handleEquipmentChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                >
                  <option value="">Choose asset...</option>
                  {equipmentList.map(item => (
                    <option key={item.id} value={item.id} disabled={item.isScraped}>
                      {item.name} {item.isScraped ? "(Scrapped)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Equipment Category</p>
                <p className="text-sm font-bold text-slate-600 uppercase italic">
                  {formData.equipmentCategory || "Auto-fills on selection..."}
                </p>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Assigned Team</p>
                <p className="text-sm font-bold text-slate-600 uppercase italic">
                  {teams.find(t => t.id === formData.teamId)?.teamName || "Auto-fills on selection..."}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" /> Scheduled Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Assign Technician</label>
                <select
                  disabled={!formData.teamId}
                  value={formData.assignedTechnicianId}
                  onChange={(e) => setFormData({ ...formData, assignedTechnicianId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium disabled:opacity-50"
                >
                  <option value="">Select individual...</option>
                  {filteredTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.displayName}</option>
                  ))}
                </select>
                {!formData.teamId && <p className="text-[10px] text-amber-500 font-bold mt-1">Select equipment first</p>}
              </div>

              <div className="pt-4 md:col-span-2 border-t border-slate-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Workflow Stage</label>
                    <div className="flex flex-wrap gap-2">
                      {["New", "In Progress", "Repaired", "Scrap"].map(stage => {
                        const canScrap = isAdmin || user?.role === "manager";
                        if (stage === "Scrap" && !canScrap) return null;
                        
                        return (
                          <button
                            key={stage}
                            type="button"
                            onClick={() => setFormData({ ...formData, stage })}
                            className={`px-4 py-2 rounded-xl font-bold text-[10px] border-2 transition-all ${
                              formData.stage === stage 
                                ? "bg-slate-900 border-slate-900 text-white" 
                                : "bg-white border-slate-100 text-slate-400"
                            }`}
                          >
                            {stage}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2 ${!isRepaired && 'opacity-30'}`}>
                      <Clock className="h-4 w-4" /> Hours Spent
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      disabled={!isRepaired}
                      value={formData.hoursSpent}
                      onChange={(e) => setFormData({ ...formData, hoursSpent: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none font-medium disabled:bg-slate-100 disabled:border-transparent transition-all"
                      placeholder="e.g. 2.5"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-8 mt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" /> {isNew ? "Launch Request" : "Update Request"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestForm;
