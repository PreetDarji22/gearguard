import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  UserPlus, 
  Trash2, 
  Check, 
  X,
  Search
} from "lucide-react";
import { doc, getDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";

const TeamDetail = () => {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  
  const [teamName, setTeamName] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users to choose from
        const usersSnap = await getDocs(collection(db, "users"));
        setAllUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        if (!isNew) {
          const docRef = doc(db, "teams", id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setTeamName(data.teamName);
            setSelectedMemberIds(data.members || []);
          }
        }
      } catch (err) {
        toast.error("Error loading team details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isNew]);

  const toggleMember = (userId) => {
    setSelectedMemberIds(prev => 
      prev.includes(userId) 
        ? prev.filter(mid => mid !== userId) 
        : [...prev, userId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return toast.error("Team name is required");
    
    setSaving(true);
    try {
      const teamData = {
        teamName,
        members: selectedMemberIds,
        updatedAt: new Date()
      };

      if (isNew) {
        await addDoc(collection(db, "teams"), {
          ...teamData,
          createdAt: new Date()
        });
        toast.success("Team created!");
      } else {
        await updateDoc(doc(db, "teams", id), teamData);
        toast.success("Team updated!");
      }
      navigate("/teams");
    } catch (err) {
      toast.error("Failed to save team");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this team? This action cannot be undone.`)) {
      setSaving(true);
      try {
        await deleteDoc(doc(db, "teams", id));
        toast.success("Team deleted!");
        navigate("/teams");
      } catch (err) {
        toast.error("Failed to delete team");
        setSaving(false);
      }
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-slate-500">Loading team configuration...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate("/teams")}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold"
        >
          <ArrowLeft className="h-5 w-5" /> Back to Teams
        </button>
        {!isNew && (
          <button 
            onClick={handleDelete}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Trash2 className="h-5 w-5" /> Delete Team
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-8">
          <form onSubmit={handleSave} className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Team Name</label>
              <input
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300"
                placeholder="e.g. Electrical Maintenance Unit"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">Assign Members</label>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 custom-scrollbar">
                {filteredUsers.map(user => {
                  const isSelected = selectedMemberIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/50" 
                          : "border-slate-50 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {user.displayName?.charAt(0) || <UserPlus className="h-5 w-5" />}
                        </div>
                        <div className="text-left">
                          <p className={`text-sm font-bold truncate max-w-[150px] ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>
                            {user.displayName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{user.email}</p>
                        </div>
                      </div>
                      <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? "bg-indigo-600 border-indigo-600 text-white" 
                          : "border-slate-200 group-hover:border-slate-300"
                      }`}>
                        {isSelected && <Check className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-slate-50">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-70"
              >
                {saving ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5" /> {isNew ? "Create Team" : "Update Team"}
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

export default TeamDetail;
