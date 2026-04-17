import React from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CalendarView = ({ requests }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const navigate = useNavigate();

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white rounded-xl border border-slate-100 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          </button>
          <button 
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            Today
          </button>
          <button 
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white rounded-xl border border-slate-100 transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const rows = [];
    let dayCells = [];

    days.forEach((day, index) => {
      const dayRequests = requests.filter(req => 
        req.scheduledDate && isSameDay(new Date(req.scheduledDate), day)
      );

      dayCells.push(
        <div 
          key={day.toString()}
          onClick={() => navigate(`/requests/new?date=${format(day, "yyyy-MM-dd")}`)}
          className={`min-h-[120px] p-2 border border-slate-50 relative group cursor-pointer transition-colors hover:bg-blue-50/30 ${
            !isSameMonth(day, monthStart) ? "bg-slate-50/50 text-slate-300" : "bg-white text-slate-700"
          } ${isSameDay(day, new Date()) ? "ring-2 ring-inset ring-blue-500/20 bg-blue-50/10" : ""}`}
        >
          <div className="flex justify-between items-start mb-1">
            <span className={`text-xs font-bold p-1 rounded-md ${
              isSameDay(day, new Date()) ? "bg-blue-600 text-white" : ""
            }`}>
              {format(day, "d")}
            </span>
            <button className="opacity-0 group-hover:opacity-100 p-1 bg-white shadow-sm rounded-md border border-slate-100 text-blue-600 transition-all">
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayRequests.map(req => (
              <div 
                key={req.id}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/requests/${req.id}`);
                }}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate ${
                  req.type === "Preventive" 
                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                    : "bg-amber-50 text-amber-700 border-amber-100"
                }`}
              >
                {req.subject}
              </div>
            ))}
          </div>
        </div>
      );

      if ((index + 1) % 7 === 0) {
        rows.push(
          <div className="grid grid-cols-7" key={day.toString()}>
            {dayCells}
          </div>
        );
        dayCells = [];
      }
    });

    return (
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        {rows}
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {renderHeader()}
      {renderDays()}
    </div>
  );
};

export default CalendarView;
