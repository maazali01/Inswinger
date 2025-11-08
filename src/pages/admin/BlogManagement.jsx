import { useEffect, useState, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { MdAdd, MdEdit, MdDelete, MdClose, MdArticle, MdCalendarToday, MdLink } from 'react-icons/md';

export default function BlogManagement() {
	const [blogs, setBlogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [deletingId, setDeletingId] = useState(null);

	// Add/Edit modal state
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState(null); // null => add, otherwise blog object
	const [form, setForm] = useState({ title: '', slug: '', content: '' });
	const editorRef = useRef(null);

	const fetchBlogs = async () => {
		try {
			setLoading(true);
			// select all columns to avoid assuming extra columns exist
			const { data, error } = await supabase
				.from('blogs')
				.select('*')
				.order('created_at', { ascending: false });
			if (error) throw error;
			setBlogs(data || []);
		} catch (err) {
			console.error('Error fetching blogs:', err);
			alert(err.message || 'Failed to load blogs');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchBlogs();
	}, []);

	useEffect(() => {
		// when opening edit modal, populate editor HTML
		if (showModal && editing && editorRef.current) {
			editorRef.current.innerHTML = editing.content || '';
		}
	}, [showModal, editing]);

	const openAdd = () => {
		setEditing(null);
		setForm({ title: '', slug: '', content: '' });
		setShowModal(true);
	};

	const openEdit = (b) => {
		setEditing(b);
		setForm({
			title: b.title ?? '',
			slug: b.slug ?? '',
			content: b.content ?? b.body ?? ''
		});
		setShowModal(true);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setForm(prev => {
			const next = { ...prev, [name]: value };
			// Auto-generate slug when title changes and slug is empty or matches previous auto
			if (name === 'title') {
				const auto = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
				// only replace slug if user didn't customize it
				if (!prev.slug || prev.slug === prev.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) {
					next.slug = auto;
				}
			}
			return next;
		});
	};

	const execFormat = (command, value = null) => {
		document.execCommand(command, false, value);
		// update form.content immediately for local state if desired
		if (editorRef.current) {
			setForm(prev => ({ ...prev, content: editorRef.current.innerHTML }));
		}
	};

	const handleSave = async (e) => {
		e.preventDefault();
		try {
			// take HTML from contentEditable editor
			const contentHtml = editorRef.current?.innerHTML || form.content || '';
			const payload = {
				title: form.title,
				slug: form.slug,
				content: contentHtml
			};
			if (editing) {
				const { error } = await supabase.from('blogs').update(payload).eq('id', editing.id);
				if (error) throw error;
				alert('Blog updated');
			} else {
				const { error } = await supabase.from('blogs').insert([payload]);
				if (error) throw error;
				alert('Blog added');
			}
			setShowModal(false);
			fetchBlogs();
		} catch (err) {
			console.error('Save blog error:', err);
			// Duplicate slug handling
			if (err?.code === '23505' || (err?.message && err.message.toLowerCase().includes('duplicate') && err.message.toLowerCase().includes('slug'))) {
				alert('Slug already exists. Please choose a unique slug.');
			} else {
				alert(err.message || 'Failed to save blog');
			}
		}
	};

	const handleDelete = async (id) => {
		if (!confirm('Delete this blog? This action cannot be undone.')) return;
		try {
			setDeletingId(id);
			const { error } = await supabase.from('blogs').delete().eq('id', id);
			if (error) throw error;
			alert('Blog deleted successfully!');
			fetchBlogs();
		} catch (err) {
			console.error('Delete blog error:', err);
			alert(err.message || 'Failed to delete blog');
		} finally {
			setDeletingId(null);
		}
	};

	const filteredBlogs = blogs.filter(blog => {
		const title = blog.title ?? '';
		const slug = blog.slug ?? '';
		return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			   slug.toLowerCase().includes(searchTerm.toLowerCase());
	});

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-900 text-gray-100">
				<Sidebar />
				<main className="flex-1 p-6 ml-64 flex items-center justify-center">
					<div className="text-gray-100 text-xl">Loading...</div>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-900 text-gray-100">
			<Sidebar />
			<main className="flex-1 p-8 ml-64">
				<header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div>
						<h1 className="text-3xl font-bold text-white">Blog Management</h1>
						<p className="mt-2 text-gray-400">Create and manage blog posts</p>
					</div>
					<button 
						onClick={openAdd} 
						className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<MdAdd className="text-xl" />
						<span className="font-medium">Add Blog</span>
					</button>
				</header>

				{/* Search */}
				<div className="mb-6">
					<div className="relative max-w-md">
						<input
							type="text"
							placeholder="Search blogs by title or slug..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 pl-10 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
						/>
						<MdArticle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
						{searchTerm && (
							<button
								onClick={() => setSearchTerm('')}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
							>
								<MdClose />
							</button>
						)}
					</div>
				</div>

				{/* Stats */}
				<div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
						<p className="text-sm text-gray-400">Total Blogs</p>
						<p className="text-2xl font-bold text-white mt-1">{blogs.length}</p>
					</div>
					<div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
						<p className="text-sm text-gray-400">Filtered Results</p>
						<p className="text-2xl font-bold text-blue-400 mt-1">{filteredBlogs.length}</p>
					</div>
				</div>

				{/* Blogs List */}
				<div className="space-y-4">
					{filteredBlogs.length === 0 ? (
						<div className="text-center py-12 text-gray-400">No blogs found.</div>
					) : (
						filteredBlogs.map(b => {
							const created = b.created_at ? new Date(b.created_at).toLocaleDateString() : '-';
							const title = b.title ?? `#${b.id}`;
							const slug = b.slug ? `/${b.slug}` : '-';
							const preview = (b.content || b.body || '').substring(0, 150);

							return (
								<div 
									key={b.id} 
									className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200"
								>
									<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
										<div className="flex-1">
											<div className="flex items-start gap-3 mb-3">
												<div className="p-2 bg-purple-500/10 rounded-lg">
													<MdArticle className="text-2xl text-purple-400" />
												</div>
												<div className="flex-1">
													<h3 className="text-lg font-semibold text-white">{title}</h3>
													<div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
														<MdLink className="text-blue-400" />
														<span className="text-blue-400">{slug}</span>
													</div>
													{preview && (
														<p className="mt-2 text-sm text-gray-400 line-clamp-2">
															{preview}...
														</p>
													)}
												</div>
											</div>
										</div>

										<div className="flex items-center gap-3 lg:flex-col lg:items-end">
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<MdCalendarToday />
												{created}
											</div>
											<div className="flex items-center gap-2">
												<button 
													onClick={() => openEdit(b)} 
													className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
												>
													<MdEdit />
													<span className="text-xs font-medium">Edit</span>
												</button>
												<button 
													onClick={() => handleDelete(b.id)}
													disabled={deletingId === b.id}
													className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
												>
													<MdDelete />
													<span className="text-xs font-medium">
														{deletingId === b.id ? 'Deleting...' : 'Delete'}
													</span>
												</button>
											</div>
										</div>
									</div>
								</div>
							);
						})
					)}
				</div>

				{/* Add/Edit Modal */}
				{showModal && (
					<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
						<div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
							<div className="flex items-center justify-between mb-6">
								<h2 className="text-2xl font-bold text-white">
									{editing ? 'Edit Blog' : 'Add Blog'}
								</h2>
								<button 
									onClick={() => setShowModal(false)} 
									className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
								>
									<MdClose className="text-xl" />
								</button>
							</div>
							
							<form onSubmit={handleSave} className="space-y-5">
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
									<input 
										name="title" 
										value={form.title} 
										onChange={handleChange} 
										required 
										className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
										placeholder="Enter blog title"
									/>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">Slug *</label>
									<input 
										name="slug" 
										value={form.slug} 
										onChange={handleChange} 
										required 
										className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
										placeholder="blog-post-url"
									/>
									<p className="text-xs text-gray-500 mt-1">Auto-generated from title</p>
								</div>
								
								<div>
									<label className="block text-sm font-medium text-gray-300 mb-2">Content</label>

									{/* Toolbar */}
									<div className="flex items-center gap-2 mb-2">
										<button type="button" onClick={() => execFormat('bold')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">B</button>
										<button type="button" onClick={() => execFormat('italic')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">I</button>
										<button type="button" onClick={() => execFormat('underline')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">U</button>
										<button type="button" onClick={() => execFormat('insertUnorderedList')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">• List</button>
										<button type="button" onClick={() => execFormat('insertOrderedList')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">1. List</button>
										<button type="button" onClick={() => {
											const url = prompt('Enter URL');
											if (url) execFormat('createLink', url);
										}} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">Link</button>
										<button type="button" onClick={() => execFormat('formatBlock', 'H2')} className="px-2 py-1 bg-gray-700 text-gray-200 rounded">H2</button>
									</div>

									{/* Editor */}
									<div
										ref={editorRef}
										contentEditable
										suppressContentEditableWarning
										className="min-h-[200px] bg-gray-900 border border-gray-700 rounded-lg p-4 text-gray-200 prose prose-invert overflow-auto"
										onInput={() => setForm(prev => ({ ...prev, content: editorRef.current.innerHTML }))}
									>
										{/* populated when editing via useEffect */}
									</div>
								</div>
								
								<div className="flex gap-4 pt-4">
									<button 
										type="submit" 
										className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
									>
										{editing ? 'Save Changes' : 'Add Blog'}
									</button>
									<button 
										type="button" 
										onClick={() => setShowModal(false)} 
										className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-lg hover:bg-gray-600 transition-colors font-medium"
									>
										Cancel
									</button>
								</div>
							</form>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
