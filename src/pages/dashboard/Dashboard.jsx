import React, { useEffect, useState } from "react";
import { 
  Package, 
  ClipboardList, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Clock,
  ArrowUpRight
} from "lucide-react";
import { collection, query, getDocs, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      {trend && (
        <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {trend} <TrendingUp className="h-3 w-3 ml-1" />
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-semibold mb-1 uppercase tracking-wider">{title}</p>
    <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
  </div>
);

const ActivityItem = ({ type, request, onAccept, isAdmin, currentUserId }) => {
  const isAssignedToMe = request?.assignedTechnicianId === currentUserId;
  const needsAcceptance = !request?.acceptedByTechnician && isAssignedToMe;

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors border-b border-slate-50 last:border-0 group">
      <div className={`mt-1 p-2 rounded-xl ${
        request.stage === "Repaired" ? "bg-green-100 text-green-600" :
        request.stage === "In Progress" ? "bg-blue-100 text-blue-600" :
        "bg-amber-100 text-amber-600"
      }`}>
        {type === "request" ? <ClipboardList className="h-4 w-4" /> : <Package className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{request.subject}</p>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3 w-3 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">{request.createdAt?.toDate().toLocaleDateString() || "Today"}</span>
          <span className="text-[10px] text-slate-300">•</span>
          <span className={`text-[10px] font-bold uppercase tracking-tighter ${
            request.stage === "Repaired" ? "text-green-500" :
            request.stage === "In Progress" ? "text-blue-500" :
            "text-amber-500"
          }`}>{request.stage}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isAdmin && request.acceptedByTechnician && (
          <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Accepted
          </span>
        )}
        {!isAdmin && needsAcceptance && (
          <button 
            onClick={() => onAccept(request)}
            className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors active:scale-95 shadow-sm shadow-blue-100"
          >
            Accept
          </button>
        )}
        <button className="p-2 text-slate-400 hover:text-slate-600">
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "manager";
  
  const [stats, setStats] = useState({
    totalEquipment: 0,
    openRequests: 0,
    inProgress: 0,
    repaired: 0
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    let totalEq = 0;
    getDocs(collection(db, "equipment")).then(snap => { 
      totalEq = snap.size;
      setStats(s => ({ ...s, totalEquipment: totalEq }));
    });

    const q = query(collection(db, "maintenanceRequests"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (reqSnap) => {
      const requests = reqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let applicableRequests = requests;
      if (!isAdmin) {
        applicableRequests = requests.filter(r => r.assignedTechnicianId === user?.uid);
      }
      
      setStats(s => ({
        ...s,
        openRequests: applicableRequests.filter(r => r.stage === "New").length,
        inProgress: applicableRequests.filter(r => r.stage === "In Progress").length,
        repaired: applicableRequests.filter(r => r.stage === "Repaired").length
      }));

      const sorted = applicableRequests.slice(0, 5);
      setRecentRequests(sorted);
      setLoading(false);
    });

    return unsubscribe;
  }, [isAdmin, user]);

  const handleAcceptRequest = async (request) => {
    try {
      await updateDoc(doc(db, "maintenanceRequests", request.id), {
        acceptedByTechnician: true
      });
      if (request.creatorId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: request.creatorId,
          senderId: user.uid,
          requestId: request.id,
          message: `${user.displayName || "A technician"} accepted the request: ${request.subject}`,
          read: false,
          createdAt: serverTimestamp(),
          type: "request_accepted"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-lg mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-3xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 font-outfit">
          {isAdmin ? "Operational Overview" : "My Maintenance Duties"}
        </h1>
        <p className="text-slate-500 font-medium">
          Welcome back, {user?.displayName}. Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Equipment" 
          value={stats.totalEquipment} 
          icon={Package} 
          color="bg-slate-900" 
          trend="+12%" 
        />
        <StatCard 
          title="Open Requests" 
          value={stats.openRequests} 
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="In Progress" 
          value={stats.inProgress} 
          icon={RefreshCw} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Repaired" 
          value={stats.repaired} 
          icon={CheckCircle2} 
          color="bg-green-600" 
          trend="+8%" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">Recent Activity</h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          <div className="p-2">
            {recentRequests.length > 0 ? (
              recentRequests.map(req => (
                <ActivityItem 
                  key={req.id}
                  type="request"
                  request={req}
                  onAccept={handleAcceptRequest}
                  isAdmin={isAdmin}
                  currentUserId={user?.uid}
                />
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-medium">
                No recent activity found.
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-200">
            <h3 className="font-bold text-lg mb-2">Quick Tip</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-4">
              Regularly scheduled preventive maintenance can reduce equipment downtime by up to 35%. Check the Reports module for team efficiency.
            </p>
            <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-all text-sm">
              Schedule Maintenance
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">System Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Database</span>
                <span className="flex items-center text-green-600 font-bold">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2"></div> Online
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium">Auth Service</span>
                <span className="flex items-center text-green-600 font-bold">
                  <div className="h-1.5 w-1.5 bg-green-500 rounded-full mr-2"></div> Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
