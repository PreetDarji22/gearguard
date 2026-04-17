import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Users, 
  Plus, 
  ArrowRight, 
  ShieldCheck,
  Search,
  Trash2
} from "lucide-react";
import { collection, query, getDocs, orderBy, doc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import toast from "react-hot-toast";

const TeamList = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!db) return;

    const fetchTeams = async () => {
      try {
        const q = query(collection(db, "teams"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          memberCount: doc.data().members?.length || 0
        }));
        setTeams(data);
      } catch (error) {
        toast.error("Failed to load teams.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const filteredTeams = teams.filter(team => 
    team.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id, teamName) => {
    if (window.confirm(`Are you sure you want to delete ${teamName}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, "teams", id));
        setTeams(teams.filter(t => t.id !== id));
        toast.success("Team deleted successfully");
      } catch (err) {
        toast.error("Failed to delete team");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading maintenance teams...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Teams</h1>
          <p className="text-slate-500 font-medium">Specialized units for equipment upkeep</p>
        </div>
        <Link 
          to="/teams/new" 
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
        >
          <Plus className="h-5 w-5" /> Create Team
        </Link>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-6 flex items-center shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div key={team.id} className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Users className="h-6 w-6" />
              </div>
              <ShieldCheck className="h-5 w-5 text-indigo-200" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
              {team.teamName}
            </h3>
            
            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center -space-x-2">
                {[...Array(Math.min(team.memberCount, 4))].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-400">
                    <Users className="h-3 w-3" />
                  </div>
                ))}
                {team.memberCount > 4 && (
                  <div className="h-8 w-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                    +{team.memberCount - 4}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => handleDelete(team.id, team.teamName)}
                  className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete Team"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <Link 
                  to={`/teams/${team.id}`}
                  className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm hover:underline"
                >
                  Manage <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {filteredTeams.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <p className="text-slate-400 font-medium">No teams found. Start by creating one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamList;
