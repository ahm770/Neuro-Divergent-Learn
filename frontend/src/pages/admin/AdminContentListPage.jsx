// src/pages/admin/AdminContentListPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getPublishedContentList, deleteContent } from '../../services/contentService';
import { toast } from 'react-toastify';

const LoadingMessage = () => <div className="p-4 text-center text-[var(--color-text-secondary)]">Loading content...</div>;
const ErrorAlert = ({ message }) => (
    <div className="my-4 p-3 rounded text-sm bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link" role="alert">{message}</div>
);

const Pagination = ({ currentPage, totalPages, onPageChange, disabled }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = [];
  
  // Logic for limited page numbers (e.g., first, last, current +/- 2)
  const maxPagesToShow = 5;
  let startPage, endPage;
  if (totalPages <= maxPagesToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - Math.floor(maxPagesToShow / 2);
      endPage = currentPage + Math.floor(maxPagesToShow / 2);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav aria-label="Content pagination" className="mt-6 flex justify-center">
      <ul className="inline-flex items-center -space-x-px">
        <li>
          <button
            onClick={() => onPageChange(1)}
            disabled={disabled || currentPage === 1}
            className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            First
          </button>
        </li>
        <li>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={disabled || currentPage === 1}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            Previous
          </button>
        </li>
        {startPage > 1 && (
            <li>
                <span className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span>
            </li>
        )}
        {pageNumbers.map(number => (
          <li key={number}>
            <button
              onClick={() => onPageChange(number)}
              disabled={disabled}
              className={`px-3 py-2 leading-tight border ${ currentPage === number 
                ? 'text-primary-dark bg-primary/20 border-primary-dark dark:bg-primary-light/30 dark:text-white dark:border-primary-light font-semibold' 
                : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}`}
            >
              {number}
            </button>
          </li>
        ))}
        {endPage < totalPages && (
             <li>
                <span className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span>
            </li>
        )}
        <li>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={disabled || currentPage === totalPages}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            Next
          </button>
        </li>
         <li>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={disabled || currentPage === totalPages}
            className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50"
          >
            Last
          </button>
        </li>
      </ul>
    </nav>
  );
};


const AdminContentListPage = () => {
  const [contentData, setContentData] = useState({ contents: [], currentPage: 1, totalPages: 1, totalContents: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const parseQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      search: params.get('search') || '',
      tag: params.get('tag') || '',
      creatorId: params.get('creatorId') || '', // Example: if you add creator filter
      sortBy: params.get('sortBy') || 'createdAt:desc',
      page: parseInt(params.get('page')) || 1,
      limit: parseInt(params.get('limit')) || 10,
    };
  };

  const [activeFilters, setActiveFilters] = useState(parseQueryParams());


  const fetchContents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const paramsToFetch = { ...activeFilters };
    // Remove empty filter values before sending to API
    Object.keys(paramsToFetch).forEach(key => (paramsToFetch[key] === '' || paramsToFetch[key] === null) && delete paramsToFetch[key]);

    try {
      const data = await getPublishedContentList(paramsToFetch);
      setContentData(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch content list.');
      console.error("Fetch content list error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeFilters]); // Depend on the single state object for filters/pagination

  useEffect(() => {
    // Update URL when activeFilters change
    const newSearch = new URLSearchParams(activeFilters).toString();
    navigate(`${location.pathname}?${newSearch}`, { replace: true });
    fetchContents();
  }, [activeFilters, fetchContents, navigate, location.pathname]);


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveFilters(prev => ({ ...prev, [name]: value, page: 1 })); // Reset page on filter change
  };

  const handleSortChange = (e) => {
    setActiveFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }));
  };
  
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= contentData.totalPages) {
      setActiveFilters(prev => ({ ...prev, page: pageNumber }));
    }
  };

  const handleLimitChange = (e) => {
    setActiveFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
  }

  const handleDelete = async (contentId, topic) => {
    if (window.confirm(`Are you sure you want to delete the topic "${topic}"? This action cannot be undone.`)) {
      try {
        await deleteContent(contentId);
        toast.success(`Topic "${topic}" deleted successfully.`);
        // Re-fetch content, considering current page might become invalid if last item deleted
        if (contentData.contents.length === 1 && activeFilters.page > 1) {
            setActiveFilters(prev => ({ ...prev, page: prev.page - 1 }));
        } else {
            fetchContents(); 
        }
      } catch (err) {
        const deleteError = err.response?.data?.error || `Failed to delete topic "${topic}".`;
        setError(deleteError); // Still useful for a persistent error message
        toast.error(deleteError);
      }
    }
  };

  const basePath = window.location.pathname.startsWith('/admin') ? '/admin' : '/creator';

  if (loading && contentData.contents.length === 0 && activeFilters.page === 1) return <LoadingMessage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">Manage Content</h1>
        <Link to={`${basePath}/content/create`} className="button-primary text-sm whitespace-nowrap">
          Create New Content
        </Link>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search-content" className="form-label-default">Search Topic/Tag</label>
              <input
                type="search" name="search" id="search-content"
                placeholder="Enter keyword..."
                className="form-input-default"
                value={activeFilters.search}
                onChange={handleFilterChange}
              />
            </div>
            <div>
              <label htmlFor="tag-filter" className="form-label-default">Filter by Specific Tag</label>
              <input
                type="text" name="tag" id="tag-filter"
                placeholder="Enter exact tag..."
                className="form-input-default"
                value={activeFilters.tag}
                onChange={handleFilterChange}
              />
            </div>
            {/* Add Creator Filter if needed by fetching list of creators */}
            {/* <div>
                <label htmlFor="creator-filter" className="form-label-default">Filter by Creator</label>
                <select name="creatorId" id="creator-filter" value={activeFilters.creatorId} onChange={handleFilterChange} className="form-input-default">
                    <option value="">All Creators</option>
                    {/* Populate with creators */}
                {/* </select>
            </div> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sort-by" className="form-label-default">Sort By</label>
              <select name="sortBy" id="sort-by" value={activeFilters.sortBy} onChange={handleSortChange} className="form-input-default">
                <option value="createdAt:desc">Created Date (Newest)</option>
                <option value="createdAt:asc">Created Date (Oldest)</option>
                <option value="topic:asc">Topic (A-Z)</option>
                <option value="topic:desc">Topic (Z-A)</option>
                <option value="updatedAt:desc">Last Updated (Newest)</option>
                <option value="updatedAt:asc">Last Updated (Oldest)</option>
              </select>
            </div>
            <div>
              <label htmlFor="limit-select" className="form-label-default">Items per Page</label>
              <select id="limit-select" name="limit" value={activeFilters.limit} onChange={handleLimitChange} className="form-input-default !w-auto">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
        </div>
      </div>

      {loading && <div className="p-4 text-center text-sm text-[var(--color-text-secondary)] animate-pulse">Updating list...</div>}

      {!loading && contentData.contents.length === 0 && (
        <div className="card text-center py-8">
            <p className="text-[var(--color-text-secondary)]">
              {activeFilters.search || activeFilters.tag ? `No content matches your criteria.` : "No content found. Get started by creating some!"}
            </p>
        </div>
      )}

      {contentData.contents.length > 0 && (
        <div className="card overflow-x-auto p-0 md:p-0">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-gray-100 dark:bg-slate-800 body-theme-high-contrast:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Topic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Tags</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Created By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {contentData.contents.map((content) => (
                <tr key={content._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 body-theme-high-contrast:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{content.topic?.replace(/-/g, ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] max-w-xs truncate" title={content.tags?.join(', ')}>{content.tags?.join(', ') || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{content.createdBy?.name || content.createdBy?.email || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{new Date(content.createdAt).toLocaleDateString()}</td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                    {content.lastUpdatedBy ? `${content.lastUpdatedBy.name || content.lastUpdatedBy.email} on ` : ''}
                    {new Date(content.updatedAt).toLocaleDateString()}
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link to={`${basePath}/content/edit/${content._id}`} className="text-primary dark:text-primary-light body-theme-high-contrast:text-hc-link hover:underline">
                      Edit
                    </Link>
                    <button onClick={() => handleDelete(content._id, content.topic)} className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 body-theme-high-contrast:text-red-400 body-theme-high-contrast:hover:text-red-300 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination 
        currentPage={activeFilters.page} 
        totalPages={contentData.totalPages} 
        onPageChange={handlePageChange} 
        disabled={loading}
      />
       <p className="text-sm text-center text-[var(--color-text-secondary)] mt-2">
        Showing {contentData.contents.length} of {contentData.totalContents} total entries.
      </p>
    </div>
  );
};

export default AdminContentListPage;