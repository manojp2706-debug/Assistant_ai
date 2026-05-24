import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, Trash2, Plus, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', content: '' });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const data = new FormData();
      if (file) {
        data.append('file', file);
      } else if (form.content) {
        data.append('content', form.content);
      } else {
        toast.error('Add a file or paste some text');
        return;
      }
      data.append('title', form.title || 'Untitled');
      data.append('subject', form.subject || 'General');

      await api.post('/notes/upload', data);
      toast.success('Note uploaded!');
      setShowUpload(false);
      setForm({ title: '', subject: '', content: '' });
      setFile(null);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this note?')) return;
    await api.delete(`/notes/${id}`);
    setNotes(notes.filter((n) => n._id !== id));
    toast.success('Deleted');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-gray-400 mt-1">Your study materials</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
        >
          <Plus size={18} /> Add Note
        </button>
      </div>

      {showUpload && (
        <form onSubmit={handleUpload} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 space-y-4">
          <h3 className="font-semibold text-white text-lg">Upload Study Material</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              placeholder="Subject (e.g. Physics)"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="border-2 border-dashed border-gray-700 rounded-xl p-4 text-center">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input" className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors">
              <Upload size={24} />
              <span>{file ? file.name : 'Click to upload PDF or TXT'}</span>
            </label>
          </div>
          <p className="text-center text-gray-500 text-sm">— or paste text below —</p>
          <textarea
            placeholder="Paste your notes here..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={5}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={uploading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center text-gray-400 py-16">Loading...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg">No notes yet. Upload your first study material!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note._id}
              onClick={() => navigate(`/notes/${note._id}`)}
              className="bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-2xl p-5 cursor-pointer transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <FileText size={20} className="text-indigo-400 mt-0.5" />
                <button
                  onClick={(e) => handleDelete(note._id, e)}
                  className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="font-semibold text-white truncate">{note.title}</h3>
              <span className="text-xs text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded-full mt-2 inline-block">
                {note.subject}
              </span>
              <p className="text-gray-500 text-xs mt-3">
                {new Date(note.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
