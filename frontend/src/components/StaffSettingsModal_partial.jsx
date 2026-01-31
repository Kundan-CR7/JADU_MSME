import axios from 'axios';
import { Users, ToggleLeft, ToggleRight } from 'lucide-react';

// Sub-component for Staff Settings
const StaffSettingsModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffList(res.data);
    } catch (err) {
      console.error("Failed to fetch staff", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      // CORRECTED: using PATCH based on user feedback
      await axios.patch(`http://localhost:3000/staff/${id}/availability`,
        { isAvailable: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Optimistic update or refetch
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, isAvailable: !currentStatus } : s));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const openModal = () => {
    fetchStaff();
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={openModal}
        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
        title="Staff Settings"
      >
        <Users size={20} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Staff Availability</h3>
              <button onClick={() => setIsOpen(false)}><X size={18} /></button>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {loading ? <p className="text-sm text-slate-500">Loading...</p> : (
                staffList.map(staff => (
                  <div key={staff.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-sm text-slate-700">{staff.name}</p>
                      <p className="text-xs text-slate-400">{staff.role}</p>
                    </div>
                    <button
                      onClick={() => toggleAvailability(staff.id, staff.isAvailable)}
                      className={`${staff.isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {staff.isAvailable ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
