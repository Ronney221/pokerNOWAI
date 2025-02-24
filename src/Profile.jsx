import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { toast } from 'react-toastify';

const Profile = ({ setCurrentPage }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser?.displayName || '');

  const handleUpdateUsername = async (e) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error('Username cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateUserProfile({ displayName: newUsername.trim() });
      toast.success('Username updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update username');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="flex w-52 flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="skeleton h-16 w-16 shrink-0 rounded-full"></div>
            <div className="flex flex-col gap-4">
              <div className="skeleton h-4 w-20"></div>
              <div className="skeleton h-4 w-28"></div>
            </div>
          </div>
          <div className="skeleton h-32 w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-base-100 rounded-box p-8 shadow-xl">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8">
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content rounded-full w-24">
                <span className="text-3xl">
                  {currentUser.displayName ? 
                    currentUser.displayName[0].toUpperCase() : 
                    currentUser.email.split('@')[0][0].toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {currentUser.displayName || currentUser.email.split('@')[0]}
              </h2>
              <p className="text-base-content/70">{currentUser.email}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="space-y-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Username</h3>
                {isEditing ? (
                  <form onSubmit={handleUpdateUsername} className="flex gap-2">
                    <input
                      type="text"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="input input-bordered flex-grow"
                      placeholder="Enter new username"
                    />
                    <button 
                      type="submit" 
                      className={`btn btn-primary ${loading ? 'loading' : ''}`}
                      disabled={loading}
                    >
                      Save
                    </button>
                    <button 
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <div className="flex justify-between items-center">
                    <p>{currentUser.displayName || 'No username set'}</p>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h3 className="card-title">Email</h3>
                <p>{currentUser.email}</p>
                <div className="card-actions justify-end">
                  <div className="badge badge-success">Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 