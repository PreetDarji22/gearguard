import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  ShieldAlert,
  ClipboardList
} from "lucide-react";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const EquipmentDetail = () => {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    serialNumber: "",
    department: "Production",
    assignedTo: "",
    location: "",
    purchaseDate: "",
    warrantyExpiry: "",
    maintenanceTeamId: "",
    isScraped: false
  });
  
  const [teams, setTeams] = useState([]);
  const [openRequestsCount, setOpenRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch teams for dropdown
        const teamsSnap = await getDocs(collection(db, "teams"));
        setTeams(teamsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (!isNew) {
          const docRef = doc(db, "equipment", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
            
            // Fetch open requests count
            const reqQuery = query(
              collection(db, "maintenanceRequests"),
              where("equipmentId", "==", id),
              where("stage", "in", ["New", "In Progress"])
            );
            const reqSnap = await getDocs(reqQuery);
            setOpenRequestsCount(reqSnap.size);
          }
        }
      } catch {
        toast.error("Error loading equipment details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isNew]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await addDoc(collection(db, "equipment"), {
          ...formData,
          createdAt: new Date(),
          isScraped: false // ensure default
        });
        toast.success("Equipment added successfully!");
      } else {
        await updateDoc(doc(db, "equipment", id), formData);
        toast.success("Equipment updated successfully!");
      }
      navigate("/equipment");
    } catch {
      toast.error("Failed to save equipment");
    } finally {
      setSaving(false);
    }
  };

  const handleScrap = async () => {
    if (!window.confirm("Are you sure you want to mark this equipment as scrapped? This will disable further editing.")) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, "equipment", id), { isScraped: true });
      // Log a note if needed (per requirements, this happens usually via maintenance request, but we add a manual toggle too)
      setFormData(prev => ({ ...prev, isScraped: true }));
      toast.success("Equipment marked as scrapped.");
    } catch {
      toast.error("Failed to scrap equipment");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading asset details...</div>;

  const isScraped = formData.isScraped;
  const isAdmin = user?.role === "admin";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/equipment")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Inventory
        </button>
        
        {!isNew && (
          <Link 
            to={`/requests?equipmentId=${id}`}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-200 transition-transform active:scale-95"
          >
            <ClipboardList className="h-4 w-4" /> 
            <span>Maintenance Requests</span>
            {openRequestsCount > 0 && (
              <span className="flex items-center justify-center bg-blue-500 text-white text-[10px] h-5 w-5 rounded-full font-bold">
                {openRequestsCount}
              </span>
            )}
          </Link>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {isScraped && (
          <div className="bg-red-500 text-white px-6 py-3 flex items-center justify-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-bold uppercase tracking-widest text-sm">Asset Scrapped - Editing Disabled</span>
          </div>
        )}

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Equipment Name</label>
                <input
                  required
                  disabled={isScraped}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                  placeholder="e.g. Industrial HVAC Unit 01"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Serial Number</label>
                <input
                  required
                  disabled={isScraped}
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Department</label>
                <select
                  disabled={isScraped}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                >
                  <option>Production</option>
                  <option>IT</option>
                  <option>Logistics</option>
                  <option>Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Assigned To (Employee)</label>
                <input
                  disabled={isScraped}
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Maintenance Team</label>
                <select
                  disabled={isScraped}
                  value={formData.maintenanceTeamId}
                  onChange={(e) => setFormData({ ...formData, maintenanceTeamId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                >
                  <option value="">Select a team</option>
                  {teams.map(team => <option key={team.id} value={team.id}>{team.teamName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Purchase Date
                </label>
                <input
                  type="date"
                  disabled={isScraped}
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Warranty Expiry
                </label>
                <input
                  type="date"
                  disabled={isScraped}
                  value={formData.warrantyExpiry}
                  onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Location
                </label>
                <input
                  disabled={isScraped}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50 transition-all font-medium"
                  placeholder="e.g. Warehouse A, Bay 4"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-slate-50">
              <div className="flex gap-4">
                {!isScraped && isAdmin && (
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-70"
                  >
                    <Save className="h-5 w-5" /> {isNew ? "Add Equipment" : "Save Changes"}
                  </button>
                )}
                
                {!isNew && !isScraped && isAdmin && (
                  <button
                    type="button"
                    onClick={handleScrap}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-red-100 text-red-600 hover:bg-red-50 rounded-2xl font-bold transition-all"
                  >
                    <Trash2 className="h-5 w-5" /> Mark as Scraped
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDetail;
