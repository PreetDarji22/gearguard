import React, { useEffect, useState } from "react";
import { 
  BarChart as ReBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  LineChart as ReLineChart,
  Line,
  Legend
} from "recharts";
import { 
  BarChart3, 
  PieChart, 
  Activity, 
  Calendar,
  TrendingUp,
  Filter
} from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

const Reports = () => {
  const [data, setData] = useState({
    byTeam: [],
    byStage: [],
    overTime: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    let unsubscribeReqs;
    let unsubscribeTeams;

    const reqsQuery = query(collection(db, "maintenanceRequests"), orderBy("createdAt"));
    const teamsQuery = collection(db, "teams");

    let latestReqs = null;
    let latestTeams = null;

    const processData = () => {
      if (!latestReqs || !latestTeams) return;

      const requests = latestReqs.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const teams = latestTeams.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 1. Process Requests per Team
      const byTeam = teams.map(team => ({
        name: team.teamName,
        requests: requests.filter(r => r.teamId === team.id).length
      }));

      // 2. Process Requests by Stage
      const stages = ["New", "In Progress", "Repaired", "Scrap"];
      const byStage = stages.map(stage => ({
        name: stage,
        value: requests.filter(r => r.stage === stage).length
      }));

      // 3. Process Requests Over Time (last 6 months)
      const last6Months = eachMonthOfInterval({
        start: subMonths(new Date(), 5),
        end: new Date()
      });

      const overTime = last6Months.map(month => {
        const monthStr = format(month, "MMM yy");
        const count = requests.filter(r => {
          if (!r.createdAt) return false;
          const created = r.createdAt.toDate();
          return format(created, "MMM yy") === monthStr;
        }).length;
        return { month: monthStr, count };
      });

      setData({ byTeam, byStage, overTime });
      setLoading(false);
    };

    unsubscribeReqs = onSnapshot(reqsQuery, (snapshot) => {
      latestReqs = snapshot;
      processData();
    }, (error) => {
      console.error("Error fetching requests:", error);
      setLoading(false);
    });

    unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      latestTeams = snapshot;
      processData();
    }, (error) => {
      console.error("Error fetching teams:", error);
      setLoading(false);
    });

    return () => {
      if (unsubscribeReqs) unsubscribeReqs();
      if (unsubscribeTeams) unsubscribeTeams();
    };
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Generating reports...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">System Analytics</h1>
          <p className="text-slate-500 font-medium">Performance insights and trends</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
          <Filter className="h-4 w-4" /> Custom Range
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Requests Over Time */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-800">Monthly Request Volume</h3>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Last 6 Months</div>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={data.overTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '16px', border: 'none', shadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={4} dot={{r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800">Requests per Team</h3>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ReBarChart data={data.byTeam} layout="vertical" margin={{left: 20}}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="requests" fill="#818cf8" radius={[0, 8, 8, 0]} barSize={20} />
              </ReBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Distribution */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <PieChart className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-800">Request Stages</h3>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={data.byStage}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.byStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend iconType="circle" />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
