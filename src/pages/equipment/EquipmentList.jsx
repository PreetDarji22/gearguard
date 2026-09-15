import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Wrench, 
  Eye,
  Trash2,
  AlertTriangle,
  Package
} from "lucide-react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const EquipmentList = () => {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");

  const isAdmin = user?.role === "admin" || user?.role === "manager";
  
  // ... rest of useEffect ...

  useEffect(() => {
    if (!db) return;

    const fetchEquipment = async () => {
      try {
        const q = query(collection(db, "equipment"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipment(data);
      } catch (error) {
        console.error("Error fetching equipment:", error);
        toast.error("Failed to load equipment list.");
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "All" || item.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departments = ["All", "Production", "IT", "Logistics", "Operations"];

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading equipment inventory...</div>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-outfit">Equipment Inventory</h1>
          <p className="text-slate-500 font-medium">Manage and track company assets</p>
        </div>
        {isAdmin && (
          <Link 
            to="/equipment/new" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
          >
            <Plus className="h-5 w-5" /> Add Equipment
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-6 flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or serial..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipment.length > 0 ? (
          filteredEquipment.map((item) => (
            <div key={item.id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${item.isScraped ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div className="flex gap-2">
                    {item.isScraped && (
                      <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-lg border border-red-200 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Scraped
                      </span>
                    )}
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg">
                      {item.department}
                    </span>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase truncate">
                  {item.name}
                </h3>
                <p className="text-slate-400 text-sm font-medium mt-1">SN: {item.serialNumber}</p>
                
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned To</p>
                    <p className="text-sm font-semibold text-slate-700">{item.assignedTo || "Unassigned"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to={`/equipment/${item.id}`} 
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-bold">No equipment found matching your criteria</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentList;
