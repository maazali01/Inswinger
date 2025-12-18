import { useEffect, useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from '../../components/Sidebar';
import { supabase } from '../../lib/supabase';
import { generateBlogContent } from '../../lib/gemini';
import { slugify } from '../../lib/utils';
import { 
	MdAdd, MdEdit, MdDelete, MdClose, MdImage, MdArticle, MdAutoAwesome, 
	MdVisibility, MdVisibilityOff, MdFormatBold, MdFormatItalic, 
	MdFormatUnderlined, MdFormatListBulleted, MdFormatListNumbered,
	MdCode, MdLink, MdFormatQuote
} from 'react-icons/md';
import { useToast } from '../../components/ToastContainer';

export default function BlogManagement() {
	const [blogs, setBlogs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [deletingId, setDeletingId] = useState(null);

	// Add/Edit modal state
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState(null); // null => add, otherwise blog object
	const [generating, setGenerating] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [formData, setFormData] = useState({
		title: '',
		content: '',
		thumbnail: '',
		published: false,
	});
	const [thumbnailFile, setThumbnailFile] = useState(null);
	const [thumbnailPreview, setThumbnailPreview] = useState('');
	const editorRef = useRef(null);
		const toast = useToast();

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
		setFormData({
			title: '',
			content: '',
			thumbnail: '',
			published: false,
		});
		setShowModal(true);
	};

	const openEdit = (blog) => {
		setEditing(blog);
		setFormData({
			title: blog.title || '',
			content: blog.content || '',
			thumbnail: blog.thumbnail || '',
			published: blog.published || false,
		});
		setShowModal(true);
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData(prev => ({ 
			...prev, 
			[name]: type === 'checkbox' ? checked : value 
		}));
	};

	const handleGenerateContent = async () => {
		if (!formData.title.trim()) {
			toast.warning('Please enter a blog title first');
			return;
		}
		
		setGenerating(true);
		try {
			const content = await generateBlogContent(formData.title);
			setFormData(prev => ({ ...prev, content }));
			// Also update editor if it's open
			if (editorRef.current) {
				editorRef.current.innerHTML = content;
			}
			toast.success('Content generated successfully!');
		} catch (error) {
			toast.error(error.message || 'Failed to generate content');
		} finally {
			setGenerating(false);
		}
	};

	const handleThumbnailSelect = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file');
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			alert('Image size should be less than 5MB');
			return;
		}

		setThumbnailFile(file);
		
		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setThumbnailPreview(reader.result);
		};
		reader.readAsDataURL(file);
	};

	const uploadThumbnail = async () => {
		if (!thumbnailFile) return formData.thumbnail;

		setUploading(true);
		try {
			const fileExt = thumbnailFile.name.split('.').pop();
			const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
			const filePath = `blog-thumbnails/${fileName}`;

			const { error: uploadError } = await supabase.storage
				.from('public-assets')
				.upload(filePath, thumbnailFile);

			if (uploadError) throw uploadError;

			const { data: urlData } = supabase.storage
				.from('public-assets')
				.getPublicUrl(filePath);

			return urlData.publicUrl;
		} catch (error) {
			console.error('Upload error:', error);
			throw new Error('Failed to upload thumbnail');
		} finally {
			setUploading(false);
		}
	};

	const execFormat = (command, value = null) => {
		document.execCommand(command, false, value);
		if (editorRef.current) {
			setFormData(prev => ({ ...prev, content: editorRef.current.innerHTML }));
		}
	};

	const handleEditorInput = () => {
		if (editorRef.current) {
			setFormData(prev => ({ ...prev, content: editorRef.current.innerHTML }));
		}
	};

	const handleLinkInsert = () => {
		const url = prompt('Enter URL:');
		if (url) {
			execFormat('createLink', url);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			// Get content from editor
			let contentToSave = formData.content;
			if (editorRef.current) {
				contentToSave = editorRef.current.innerHTML;
			}

			// Upload thumbnail if new file selected
			let thumbnailUrl = formData.thumbnail;
			if (thumbnailFile) {
				thumbnailUrl = await uploadThumbnail();
			}

			const slug = slugify(formData.title);

			const blogData = {
				title: formData.title,
				content: contentToSave, // Save as HTML
				thumbnail: thumbnailUrl || null,
				published: formData.published || false,
				slug: slug,
			};

			if (editing) {
				const { error } = await supabase
					.from('blogs')
					.update(blogData)
					.eq('id', editing.id);
				if (error) throw error;
				toast.success('Blog updated successfully!');
			} else {
				const { error } = await supabase
					.from('blogs')
					.insert([blogData]);
				if (error) throw error;
				toast.success('Blog added successfully!');
			}
			
			setShowModal(false);
			setThumbnailFile(null);
			setThumbnailPreview('');
			fetchBlogs();
		} catch (err) {
			console.error('Save blog error:', err);
			toast.error(err.message || 'Failed to save blog');
		}
	};

	const handleDelete = async (id) => {
		if (!confirm('Delete this blog? This action cannot be undone.')) return;
		try {
			setDeletingId(id);
			const { error } = await supabase.from('blogs').delete().eq('id', id);
			if (error) throw error;
			toast.success('Blog deleted successfully!');
			fetchBlogs();
		} catch (err) {
			console.error('Delete blog error:', err);
			toast.error(err.message || 'Failed to delete blog');
		} finally {
			setDeletingId(null);
		}
	};

	const togglePublish = async (blog) => {
		try {
			const { error } = await supabase
				.from('blogs')
				.update({ published: !blog.published })
				.eq('id', blog.id);
			if (error) throw error;
			toast.success(blog.published ? 'Blog unpublished' : 'Blog published');
			fetchBlogs();
		} catch (err) {
			console.error('Toggle publish error:', err);
			toast.error(err.message || 'Failed to update blog');
		}
	};

	const filteredBlogs = blogs.filter(blog =>
		blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
		blog.content?.toLowerCase().includes(searchTerm.toLowerCase())
	);

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
		<>
			<Helmet>
				<title>Blog Management | Admin - Inswinger+</title>
				<meta name="description" content="Manage sports blogs, articles, and news content for Inswinger+ platform." />
				<meta name="robots" content="noindex,nofollow" />
			</Helmet>
			<div className="min-h-screen bg-gray-900 text-gray-100">
				<Sidebar />
				<main className="flex-1 p-8 md:ml-64">
					<header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div>
							<h1 className="text-3xl font-bold text-white">Blog Management</h1>
							<p className="mt-2 text-gray-400">Create and manage blog posts with AI assistance</p>
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
								placeholder="Search blogs..."
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
					<div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
							<p className="text-sm text-gray-400">Total Blogs</p>
							<p className="text-2xl font-bold text-white mt-1">{blogs.length}</p>
						</div>
						<div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
							<p className="text-sm text-gray-400">Published</p>
							<p className="text-2xl font-bold text-green-400 mt-1">{blogs.filter(b => b.published).length}</p>
						</div>
						<div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
							<p className="text-sm text-gray-400">Drafts</p>
							<p className="text-2xl font-bold text-yellow-400 mt-1">{blogs.filter(b => !b.published).length}</p>
						</div>
					</div>

					{/* Blogs List */}
					<div className="space-y-4">
						{filteredBlogs.length === 0 ? (
							<div className="text-center py-12 text-gray-400">No blogs found.</div>
						) : (
							filteredBlogs.map(blog => (
								<div 
									key={blog.id} 
									className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all duration-200"
								>
									<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
										<div className="flex-1">
											<div className="flex items-start gap-3 mb-3">
												<div className="p-2 bg-pink-500/10 rounded-lg">
													<MdArticle className="text-2xl text-pink-400" />
												</div>
												<div className="flex-1">
													<h3 className="text-lg font-semibold text-white">{blog.title}</h3>
													<p className="text-sm text-gray-400 mt-1 line-clamp-2">{blog.content?.substring(0, 150)}...</p>
													<div className="flex items-center gap-3 mt-2">
														<span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
															blog.published 
																? 'bg-green-500/20 text-green-400' 
																: 'bg-yellow-500/20 text-yellow-400'
														}`}>
															{blog.published ? 'Published' : 'Draft'}
														</span>
														<span className="text-xs text-gray-500">
															{new Date(blog.created_at).toLocaleDateString()}
														</span>
													</div>
												</div>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<button 
												onClick={() => togglePublish(blog)}
												className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
													blog.published 
														? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' 
														: 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
												}`}
											>
												{blog.published ? <MdVisibilityOff /> : <MdVisibility />}
												<span className="text-xs font-medium">{blog.published ? 'Unpublish' : 'Publish'}</span>
											</button>
											<button 
												onClick={() => openEdit(blog)} 
												className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors"
											>
												<MdEdit />
												<span className="text-xs font-medium">Edit</span>
											</button>
											<button 
												onClick={() => handleDelete(blog.id)}
												disabled={deletingId === blog.id}
												className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
											>
												<MdDelete />
												<span className="text-xs font-medium">
													{deletingId === blog.id ? 'Deleting...' : 'Delete'}
												</span>
											</button>
										</div>
									</div>
								</div>
							))
						)}
					</div>

					{/* Add/Edit Modal */}
					{showModal && (
						<div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
							<div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
								<div className="flex items-center justify-between mb-6">
									<h2 className="text-2xl font-bold text-white">
										{editing ? 'Edit Blog' : 'Add New Blog'}
									</h2>
									<button
										onClick={() => setShowModal(false)}
										className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
									>
										<MdClose className="text-2xl" />
									</button>
								</div>

								<form onSubmit={handleSubmit} className="space-y-6">
									{/* Title */}
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Blog Title *
										</label>
										<input
											type="text"
											value={formData.title}
											onChange={(e) => setFormData({ ...formData, title: e.target.value })}
											required
											className="input-field"
											placeholder="Enter blog title..."
										/>
									</div>

									{/* Thumbnail Upload */}
									<div>
										<label className="block text-sm font-medium text-gray-300 mb-2">
											Thumbnail Image
										</label>
										
										{/* Preview */}
										{thumbnailPreview && (
											<div className="mb-4 relative">
												<img
													src={thumbnailPreview}
													alt="Thumbnail preview"
													className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-700"
												/>
												<button
													type="button"
													onClick={() => {
														setThumbnailFile(null);
														setThumbnailPreview('');
														setFormData({ ...formData, thumbnail: '' });
													}}
													className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
												>
													<MdClose />
												</button>
											</div>
										)}

										{/* File Input */}
										<div className="flex items-center gap-4">
											<label className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 cursor-pointer transition-colors">
												<MdImage className="text-xl" />
												<span>{thumbnailFile ? 'Change Image' : 'Browse Image'}</span>
												<input
													type="file"
													accept="image/*"
													onChange={handleThumbnailSelect}
													className="hidden"
												/>
											</label>
											{thumbnailFile && (
												<span className="text-sm text-gray-400">
													{thumbnailFile.name}
												</span>
											)}
										</div>
										<p className="text-xs text-gray-500 mt-2">
											Recommended: 1200x630px, max 5MB (JPG, PNG, WebP)
										</p>
									</div>

									{/* Rich Text Editor with AI Generate */}
									<div>
										<div className="flex items-center justify-between mb-2">
											<label className="block text-sm font-medium text-gray-300">
												Blog Content *
											</label>
											<button
												type="button"
												onClick={handleGenerateContent}
												disabled={generating || !formData.title}
												className="inline-flex items-center gap-2 text-sm px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
											>
												<MdAutoAwesome className={generating ? 'animate-spin' : ''} />
												<span>{generating ? 'Generating...' : 'AI Generate'}</span>
											</button>
										</div>

										{/* Formatting Toolbar */}
										<div className="bg-gray-800 border border-gray-700 rounded-t-lg p-2 flex flex-wrap items-center gap-1">
											<button
												type="button"
												onClick={() => execFormat('bold')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Bold"
											>
												<MdFormatBold className="text-gray-300" />
											</button>
											<button
												type="button"
												onClick={() => execFormat('italic')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Italic"
											>
												<MdFormatItalic className="text-gray-300" />
											</button>
											<button
												type="button"
												onClick={() => execFormat('underline')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Underline"
											>
												<MdFormatUnderlined className="text-gray-300" />
											</button>

											<div className="w-px h-6 bg-gray-700 mx-1" />

											<button
												type="button"
												onClick={() => execFormat('insertUnorderedList')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Bullet List"
											>
												<MdFormatListBulleted className="text-gray-300" />
											</button>
											<button
												type="button"
												onClick={() => execFormat('insertOrderedList')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Numbered List"
											>
												<MdFormatListNumbered className="text-gray-300" />
											</button>

											<div className="w-px h-6 bg-gray-700 mx-1" />

											<button
												type="button"
												onClick={() => execFormat('formatBlock', 'blockquote')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Quote"
											>
												<MdFormatQuote className="text-gray-300" />
											</button>
											<button
												type="button"
												onClick={() => execFormat('formatBlock', 'pre')}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Code Block"
											>
												<MdCode className="text-gray-300" />
											</button>
											<button
												type="button"
												onClick={handleLinkInsert}
												className="p-2 hover:bg-gray-700 rounded transition-colors"
												title="Insert Link"
											>
												<MdLink className="text-gray-300" />
											</button>

											<div className="w-px h-6 bg-gray-700 mx-1" />

											<select
												onChange={(e) => execFormat('formatBlock', e.target.value)}
												className="text-sm bg-gray-700 text-gray-300 border-none rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
												defaultValue=""
											>
												<option value="">Paragraph</option>
												<option value="h1">Heading 1</option>
												<option value="h2">Heading 2</option>
												<option value="h3">Heading 3</option>
												<option value="h4">Heading 4</option>
											</select>
										</div>

										{/* Contenteditable Editor */}
										<div
											ref={editorRef}
											contentEditable
											onInput={handleEditorInput}
											className="min-h-[300px] max-h-[500px] overflow-y-auto bg-gray-900 border border-gray-700 border-t-0 rounded-b-lg p-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 prose prose-invert max-w-none"
											style={{
												whiteSpace: 'pre-wrap',
												wordWrap: 'break-word',
											}}
										/>
										<p className="text-xs text-gray-500 mt-2">
											Use the toolbar above to format your content. HTML will be saved automatically.
										</p>
									</div>

									{/* Published Toggle */}
									<div className="flex items-center gap-2">
										<input
											type="checkbox"
											id="published"
											checked={formData.published}
											onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
											className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
										/>
										<label htmlFor="published" className="text-sm text-gray-300">
											Publish immediately
										</label>
									</div>

									{/* Buttons */}
									<div className="flex gap-4 pt-4 border-t border-gray-700">
										<button
											type="submit"
											disabled={uploading}
											className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
										>
											{uploading ? 'Uploading...' : editing ? 'Update Blog' : 'Create Blog'}
										</button>
										<button
											type="button"
											onClick={() => setShowModal(false)}
											className="flex-1 bg-gray-700 text-gray-300 py-2.5 rounded-lg hover:bg-gray-600 font-medium"
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
		</>
	);
}
