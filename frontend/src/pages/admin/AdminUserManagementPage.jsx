// src/pages/admin/AdminUserManagementPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation, useNavigate
import { getAllUsersAdmin, updateUserRoleAdmin, deleteUserAdmin } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoadingMessage = () => <div className="p-4 text-center text-[var(--color-text-secondary)]">Loading users...</div>;
const ErrorAlert = ({ message }) => (
    <div className="my-4 p-3 rounded text-sm bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 body-theme-high-contrast:bg-hc-background body-theme-high-contrast:border-hc-link body-theme-high-contrast:text-hc-link" role="alert">{message}</div>
);

// Reusable Pagination Component (same as in AdminContentListPage, could be common)
const Pagination = ({ currentPage, totalPages, onPageChange, disabled }) => {
  if (totalPages <= 1) return null;
  const pageNumbers = [];
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
    <nav aria-label="Users pagination" className="mt-6 flex justify-center">
      <ul className="inline-flex items-center -space-x-px">
        <li><button onClick={() => onPageChange(1)} disabled={disabled || currentPage === 1} className="px-3 py-2 ml-0 leading-tight text-gray-500 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">First</button></li>
        <li><button onClick={() => onPageChange(currentPage - 1)} disabled={disabled || currentPage === 1} className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">Previous</button></li>
        {startPage > 1 && <li><span className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span></li>}
        {pageNumbers.map(number => (<li key={number}><button onClick={() => onPageChange(number)} disabled={disabled} className={`px-3 py-2 leading-tight border ${ currentPage === number ? 'text-primary-dark bg-primary/20 border-primary-dark dark:bg-primary-light/30 dark:text-white dark:border-primary-light font-semibold' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'}`}>{number}</button></li>))}
        {endPage < totalPages && <li><span className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">...</span></li>}
        <li><button onClick={() => onPageChange(currentPage + 1)} disabled={disabled || currentPage === totalPages} className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">Next</button></li>
        <li><button onClick={() => onPageChange(totalPages)} disabled={disabled || currentPage === totalPages} className="px-3 py-2 leading-tight text-gray-500 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50">Last</button></li>
      </ul>
    </nav>
  );
};


const AdminUserManagementPage = () => {
  const { user: currentUser } = useAuth(); 
  const [userData, setUserData] = useState({ users: [], currentPage: 1, totalPages: 1, totalUsers: 0});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  const parseUserQueryParams = () => {
    const params = new URLSearchParams(location.search);
    return {
      search: params.get('search') || '',
      role: params.get('role') || '',
      sortBy: params.get('sortBy') || 'createdAt:desc',
      page: parseInt(params.get('page')) || 1,
      limit: parseInt(params.get('limit')) || 10,
    };
  };
  const [activeUserFilters, setActiveUserFilters] = useState(parseUserQueryParams());


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const paramsToFetch = { ...activeUserFilters };
    Object.keys(paramsToFetch).forEach(key => (paramsToFetch[key] === '' || paramsToFetch[key] === null) && delete paramsToFetch[key]);

    try {
      const data = await getAllUsersAdmin(paramsToFetch);
      setUserData(data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to fetch users.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [activeUserFilters]);

  useEffect(() => {
    const newSearch = new URLSearchParams(activeUserFilters).toString();
    navigate(`${location.pathname}?${newSearch}`, { replace: true });
    fetchUsers();
  }, [activeUserFilters, fetchUsers, navigate, location.pathname]);


  const handleUserFilterChange = (e) => {
    const { name, value } = e.target;
    setActiveUserFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleUserSortChange = (e) => {
    setActiveUserFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }));
  };

  const handleUserPageChange = (pageNumber) => {
     if (pageNumber >= 1 && pageNumber <= userData.totalPages) {
      setActiveUserFilters(prev => ({ ...prev, page: pageNumber }));
    }
  };
  
  const handleUserLimitChange = (e) => {
    setActiveUserFilters(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1}));
  }


  const handleRoleChange = async (userId, newRole) => {
    if (currentUser._id === userId && newRole !== 'admin') {
        const adminUsers = userData.users.filter(u => u.role === 'admin');
        if (adminUsers.length <= 1) {
            toast.error("Cannot remove the last admin's role.");
            return;
        }
    }
    try {
      const updatedUser = await updateUserRoleAdmin(userId, newRole);
      // Optimistic update or re-fetch:
      setUserData(prevData => ({
          ...prevData,
          users: prevData.users.map(u => u._id === userId ? { ...u, role: updatedUser.role } : u)
      }));
      toast.success('User role updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role.');
    }
  };

  const handleDeleteUser = async (userIdToDelete, userName) => {
    if (currentUser._id === userIdToDelete) {
        toast.error("You cannot delete your own account.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete user "${userName || 'this user'}"? This action cannot be undone.`)) {
      try {
        await deleteUserAdmin(userIdToDelete);
        toast.success(`User "${userName || 'User'}" deleted successfully.`);
        if (userData.users.length === 1 && activeUserFilters.page > 1) {
            setActiveUserFilters(prev => ({ ...prev, page: prev.page - 1 }));
        } else {
            fetchUsers();
        }
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to delete user.');
      }
    }
  };


  if (loading && userData.users.length === 0 && activeUserFilters.page === 1) return <LoadingMessage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">User Management</h1>
         <Link to="/admin" className="text-sm hover:underline text-[var(--color-link)]">
            ← Back to Admin Dashboard
        </Link>
      </div>
      
      {error && <ErrorAlert message={error} />}

      <div className="card p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <label htmlFor="search-users" className="form-label-default">Search by Name or Email</label>
                <input
                type="search" name="search" id="search-users"
                placeholder="Enter name or email..."
                className="form-input-default"
                value={activeUserFilters.search}
                onChange={handleUserFilterChange}
                />
            </div>
            <div>
                <label htmlFor="role-filter" className="form-label-default">Filter by Role</label>
                <select name="role" id="role-filter" className="form-input-default" value={activeUserFilters.role} onChange={handleUserFilterChange}>
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
                </select>
            </div>
            <div>
              <label htmlFor="user-sort-by" className="form-label-default">Sort By</label>
              <select name="sortBy" id="user-sort-by" value={activeUserFilters.sortBy} onChange={handleUserSortChange} className="form-input-default">
                <option value="createdAt:desc">Joined Date (Newest)</option>
                <option value="createdAt:asc">Joined Date (Oldest)</option>
                <option value="name:asc">Name (A-Z)</option>
                <option value="name:desc">Name (Z-A)</option>
                <option value="email:asc">Email (A-Z)</option>
              </select>
            </div>
        </div>
        <div>
            <label htmlFor="user-limit-select" className="form-label-default">Items per Page</label>
            <select id="user-limit-select" name="limit" value={activeUserFilters.limit} onChange={handleUserLimitChange} className="form-input-default !w-auto">
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            </select>
        </div>
      </div>

      {loading && <div className="p-4 text-center text-sm text-[var(--color-text-secondary)] animate-pulse">Updating list...</div>}


      {!loading && userData.users.length === 0 && (
        <div className="card text-center py-8">
            <p className="text-[var(--color-text-secondary)]">
                {activeUserFilters.search || activeUserFilters.role ? 'No users match your criteria.' : 'No users found.'}
            </p>
        </div>
      )}

      {userData.users.length > 0 && (
        <div className="card overflow-x-auto p-0 md:p-0">
          <table className="min-w-full divide-y divide-[var(--color-border)]">
            <thead className="bg-gray-100 dark:bg-slate-800 body-theme-high-contrast:bg-gray-900">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Joined</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {userData.users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 body-theme-high-contrast:hover:bg-gray-700 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)]">{user.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                      className="form-input-default !py-1 !px-2 !text-xs !w-auto disabled:opacity-70 disabled:cursor-not-allowed"
                      disabled={currentUser._id === user._id && user.role === 'admin' && userData.users.filter(u=>u.role === 'admin').length <=1 }
                    >
                      <option value="user">User</option>
                      <option value="creator">Creator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user._id, user.name || user.email)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 body-theme-high-contrast:text-red-400 body-theme-high-contrast:hover:text-red-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={currentUser._id === user._id}
                    >
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
        currentPage={activeUserFilters.page} 
        totalPages={userData.totalPages} 
        onPageChange={handleUserPageChange} 
        disabled={loading}
      />
       <p className="text-sm text-center text-[var(--color-text-secondary)] mt-2">
        Showing {userData.users.length} of {userData.totalUsers} total users.
      </p>
    </div>
  );
};

export default AdminUserManagementPage;