import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Download, Cloud, Menu, X, LogOut } from 'lucide-react';
import * as XLSX from 'xlsx';
import { initializeOneDriveSync, saveToOneDrive, loadFromOneDrive, selectOneDriveFolder, getOneDriveFolder } from '../utils/oneDriveSync';

export default function DailyStatusTracker() {
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const initializeQaMembers = () => {
    const saved = localStorage.getItem('qaMembers');
    return saved ? JSON.parse(saved) : [];
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [qaMembers, setQaMembers] = useState(() => initializeQaMembers());
  const [newMember, setNewMember] = useState('');
  const [entries, setEntries] = useState([]);  // Always start empty, load from Cosmos DB
  const [dataLoaded, setDataLoaded] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingEntryDate, setEditingEntryDate] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterByDate, setFilterByDate] = useState('');
  const [monthlyExportFromDate, setMonthlyExportFromDate] = useState('');
  const [monthlyExportToDate, setMonthlyExportToDate] = useState('');
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [monthlyFilteredEntries, setMonthlyFilteredEntries] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');
  const [qaNameSearch, setQaNameSearch] = useState('');
  const [issuesSummaryMonth, setIssuesSummaryMonth] = useState('');
  const [oneDriveFolderPath, setOneDriveFolderPath] = useState('');
  const [syncStatus, setSyncStatus] = useState('ready');

  // User authentication states
  const [currentUser, setCurrentUser] = useState(() => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  });
  const [userName, setUserName] = useState('');
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNameModal, setShowNameModal] = useState(!currentUser);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const canAdd = isAdmin || currentUser?.permissions?.canAdd;
  const canEdit = isAdmin || currentUser?.permissions?.canEdit;
  const canDelete = isAdmin || currentUser?.permissions?.canDelete;

  const savedQaMembers = initializeQaMembers();

  const [formData, setFormData] = useState({
    ticketNumber: '',
    ticketStatement: '',
    ticketStatus: '',
    qaTeamMember: '',
    missingContent: 0,
    brokenLinks: 0,
    seoIssues: 0,
    altTextIssues: 0,
    ariaLabelIssues: 0,
    trademarkIssues: 0,
    disclosureIssues: 0,
    otherIssues: 0,
    notes: '',
  });

  const totalIssues =
    (formData.missingContent || 0) +
    (formData.brokenLinks || 0) +
    (formData.seoIssues || 0) +
    (formData.altTextIssues || 0) +
    (formData.ariaLabelIssues || 0) +
    (formData.trademarkIssues || 0) +
    (formData.disclosureIssues || 0) +
    (formData.otherIssues || 0);

  useEffect(() => {
    if (formData.qaTeamMember && qaMembers.length > 0 && !qaMembers.includes(formData.qaTeamMember)) {
      setFormData(prev => ({
        ...prev,
        qaTeamMember: qaMembers[0]
      }));
    }
  }, [qaMembers]);

  useEffect(() => {
    // Only save after initial data is loaded
    if (dataLoaded) {
      localStorage.setItem('dailyEntries', JSON.stringify(entries));
      // Sync to Cosmos DB
      saveToOneDrive(entries, qaMembers);
    }
  }, [entries, dataLoaded]);

  useEffect(() => {
    // Only save after initial data is loaded
    if (dataLoaded) {
      localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
      // Sync to database (approvedUsers and pendingRequests saved only to database)
      saveToOneDrive(entries, qaMembers, approvedUsers, pendingRequests);
    }
  }, [qaMembers, approvedUsers, pendingRequests, dataLoaded]);

  // Handle body overflow when sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Initialize OneDrive on component mount
  useEffect(() => {
    const initOneDrive = async () => {
      const initialized = await initializeOneDriveSync();

      // Always load data from backend/Cosmos DB
      const { entries: oneDriveEntries, qaMembers: oneDriveMembers, approvedUsers: oneDriveApprovedUsers, pendingRequests: oneDrivePendingRequests } = await loadFromOneDrive();

      // Always load from database
      setEntries(oneDriveEntries);
      setQaMembers(oneDriveMembers);
      setApprovedUsers(oneDriveApprovedUsers);
      setPendingRequests(oneDrivePendingRequests);

      if (initialized) {
        setSyncStatus('connected');
        const folderPath = await getOneDriveFolder();
        setOneDriveFolderPath(folderPath);
      }

      setDataLoaded(true);

      // Listen for changes from other windows
      window.addEventListener('onedrive-data-changed', async () => {
        const { entries: updatedEntries, qaMembers: updatedMembers, approvedUsers: updatedApprovedUsers, pendingRequests: updatedPendingRequests } = await loadFromOneDrive();
        setEntries(updatedEntries);
        setQaMembers(updatedMembers);
        setApprovedUsers(updatedApprovedUsers);
        setPendingRequests(updatedPendingRequests);
      });
    };

    initOneDrive();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Issues') || name.includes('Content') || name.includes('Links') ? parseInt(value) || 0 : value
    }));
  };

  const handleUserLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isAdmin');
      window.location.href = '/';
    }
  };

  const handleAddMember = () => {
    if (newMember.trim() === '') {
      alert('Please enter a member name');
      return;
    }
    if (qaMembers.includes(newMember)) {
      alert('This member already exists');
      return;
    }
    const updatedMembers = [...qaMembers, newMember];
    setQaMembers(updatedMembers);
    localStorage.setItem('qaMembers', JSON.stringify(updatedMembers));
    setNewMember('');
  };

  const handleDeleteMember = (memberName) => {
    if (confirm(`Delete ${memberName}?`)) {
      const updatedMembers = qaMembers.filter(m => m !== memberName);
      setQaMembers(updatedMembers);
      localStorage.setItem('qaMembers', JSON.stringify(updatedMembers));
      if (formData.qaTeamMember === memberName) {
        setFormData(prev => ({
          ...prev,
          qaTeamMember: updatedMembers[0] || ''
        }));
      }
    }
  };

  const handleAddEntry = () => {
    if (!formData.ticketNumber.trim()) {
      alert('Please enter a ticket number');
      return;
    }
    if (!formData.ticketStatement.trim()) {
      alert('Please enter a ticket statement');
      return;
    }

    const entry = {
      id: editingId || Date.now(),
      date: editingEntryDate || new Date(selectedDate).toLocaleDateString('en-IN'),
      ...formData,
      totalIssues,
    };

    let updatedEntries;
    let isEditing = false;
    if (editingId) {
      updatedEntries = entries.map(e => e.id === editingId ? entry : e);
      setEntries(updatedEntries);
      isEditing = true;
    } else {
      updatedEntries = [...entries, entry];
      setEntries(updatedEntries);
    }

    // Close modal if editing
    if (isEditing) {
      setShowEditModal(false);
      alert('Entry updated successfully!');
    }

    setEditingId(null);
    setEditingEntryDate(null);
    setFormData({
      ticketNumber: '',
      ticketStatement: '',
      ticketStatus: '',
      qaTeamMember: '',
      missingContent: 0,
      brokenLinks: 0,
      seoIssues: 0,
      altTextIssues: 0,
      ariaLabelIssues: 0,
      trademarkIssues: 0,
      disclosureIssues: 0,
      otherIssues: 0,
    });
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingId(null);
    setEditingEntryDate(null);
    setFormData({
      ticketNumber: '',
      ticketStatement: '',
      ticketStatus: '',
      qaTeamMember: '',
      missingContent: 0,
      brokenLinks: 0,
      seoIssues: 0,
      altTextIssues: 0,
      ariaLabelIssues: 0,
      trademarkIssues: 0,
      disclosureIssues: 0,
      otherIssues: 0,
      notes: '',
    });
  };

  const handleEdit = (entry) => {
    setFormData({
      ticketNumber: entry.ticketNumber,
      ticketStatement: entry.ticketStatement,
      ticketStatus: entry.ticketStatus,
      qaTeamMember: entry.qaTeamMember,
      missingContent: entry.missingContent,
      brokenLinks: entry.brokenLinks,
      seoIssues: entry.seoIssues,
      altTextIssues: entry.altTextIssues,
      ariaLabelIssues: entry.ariaLabelIssues,
      trademarkIssues: entry.trademarkIssues,
      disclosureIssues: entry.disclosureIssues,
      otherIssues: entry.otherIssues,
      notes: entry.notes || '',
    });
    setEditingId(entry.id);
    setEditingEntryDate(entry.date);
    setShowEditModal(true);
  };

  const handleDeleteEntry = (id) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      const updatedEntries = entries.filter(e => e.id !== id);
      setEntries(updatedEntries);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({
      ticketNumber: '',
      ticketStatement: '',
      ticketStatus: '',
      qaTeamMember: qaMembers[0] || '',
      missingContent: '',
      brokenLinks: '',
      seoIssues: '',
      altTextIssues: '',
      ariaLabelIssues: '',
      trademarkIssues: '',
      disclosureIssues: '',
      otherIssues: '',
      notes: '',
    });
  };

  const handleNameSubmit = async () => {
    if (!userName.trim()) {
      alert('Please enter your name');
      return;
    }

    // Check if user already approved
    const isApproved = approvedUsers.find(u => u.name === userName);
    if (isApproved) {
      localStorage.setItem('currentUser', userName);
      setCurrentUser(userName);
      setShowNameModal(false);
      setUserName('');
      return;
    }

    // Check if user already requested access
    const alreadyRequested = pendingRequests.find(r => r.name === userName);
    if (alreadyRequested) {
      alert('You already have a pending access request. Please wait for admin approval.');
      return;
    }

    // If no approved users, make first user admin
    if (approvedUsers.length === 0) {
      const userData = { name: userName, approvedAt: new Date().toISOString(), role: 'admin' };
      const updatedUsers = [...approvedUsers, userData];
      setApprovedUsers(updatedUsers);
      // Save to database immediately
      await saveToOneDrive(entries, qaMembers, updatedUsers, pendingRequests);
      localStorage.setItem('currentUser', userName);
      setCurrentUser(userName);
      setShowNameModal(false);
      setUserName('');
      alert('✅ You are the first user - admin access granted!');
    } else {
      // Create pending access request
      const request = { name: userName, requestedAt: new Date().toISOString(), status: 'pending' };
      const updatedRequests = [...pendingRequests, request];
      setPendingRequests(updatedRequests);
      // Save to database immediately
      await saveToOneDrive(entries, qaMembers, approvedUsers, updatedRequests);
      alert('📋 Access request submitted! Please wait for admin approval.');
      setShowNameModal(false);
      setUserName('');
    }
  };

  const getAdminUsers = () => {
    return approvedUsers.filter(user => user.role === 'admin');
  };

  const isCurrentUserAdmin = () => {
    return approvedUsers.find(user => user.name === currentUser)?.role === 'admin';
  };

  const handleChangeRole = async (userName, newRole) => {
    const adminCount = getAdminUsers().length;
    const userToChange = approvedUsers.find(u => u.name === userName);

    if (userToChange?.role === 'admin' && newRole === 'user' && adminCount === 1) {
      alert('Cannot demote the last admin. Promote another user to admin first.');
      return;
    }

    const updatedUsers = approvedUsers.map(user =>
      user.name === userName ? { ...user, role: newRole } : user
    );
    setApprovedUsers(updatedUsers);
    // Save to database immediately
    await saveToOneDrive(entries, qaMembers, updatedUsers, pendingRequests);
  };

  const handleApproveRequest = async (requestName) => {
    const userData = { name: requestName, approvedAt: new Date().toISOString(), role: 'user' };
    const updatedUsers = [...approvedUsers, userData];
    const updatedRequests = pendingRequests.filter(r => r.name !== requestName);

    setApprovedUsers(updatedUsers);
    setPendingRequests(updatedRequests);
    // Save to database immediately
    await saveToOneDrive(entries, qaMembers, updatedUsers, updatedRequests);
    alert(`✅ Approved ${requestName}!`);
  };

  const handleRejectRequest = async (requestName) => {
    const updatedRequests = pendingRequests.filter(r => r.name !== requestName);
    setPendingRequests(updatedRequests);
    // Save to database immediately
    await saveToOneDrive(entries, qaMembers, approvedUsers, updatedRequests);
    alert(`❌ Rejected ${requestName}'s access request.`);
  };

  const handleDeleteUser = async (userName) => {
    if (!isCurrentUserAdmin()) {
      alert('Only admins can delete users');
      return;
    }

    const userToDelete = approvedUsers.find(u => u.name === userName);
    const adminCount = getAdminUsers().length;

    if (userToDelete?.role === 'admin' && adminCount === 1) {
      alert('Cannot delete the last admin. Assign admin role to another user first.');
      return;
    }

    if (confirm(`Delete user ${userName}?`)) {
      const updatedUsers = approvedUsers.filter(user => user.name !== userName);
      setApprovedUsers(updatedUsers);
      // Save to database immediately
      await saveToOneDrive(entries, qaMembers, updatedUsers, pendingRequests);
      if (currentUser === userName) {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        setShowNameModal(true);
      }
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      setShowNameModal(true);
    }
  };

  const handleRefreshPermissions = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('❌ No active session found. Please login again.');
        return;
      }

      const response = await fetch(`${typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        alert('❌ Failed to refresh permissions. Token may have expired. Please login again.');
        return;
      }

      // Update current user with latest permissions
      const updatedUser = {
        ...currentUser,
        permissions: data.user.permissions,
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      alert('✅ Permissions refreshed successfully!');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error refreshing permissions:', error);
      alert('❌ Error refreshing permissions. Please try again.');
    }
  };

  const handleFilterByDate = () => {
    if (!filterByDate) {
      alert('Please select a date');
      return;
    }

    const selectedDate = new Date(filterByDate);
    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.date.split('/').reverse().join('-'));
      return entryDate.toDateString() === selectedDate.toDateString();
    });

    if (filtered.length === 0) {
      alert('No entries found for the selected date');
      return;
    }

    setFilteredEntries(filtered);
  };

  const handleFilterByMonth = () => {
    if (!monthlyExportFromDate || !monthlyExportToDate) {
      alert('Please select both From Date and To Date');
      return;
    }

    const fromDate = new Date(monthlyExportFromDate);
    const toDate = new Date(monthlyExportToDate);

    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.date.split('/').reverse().join('-'));
      return entryDate >= fromDate && entryDate <= toDate;
    });

    if (filtered.length === 0) {
      alert('No entries found for the selected date range');
      return;
    }

    setMonthlyFilteredEntries(filtered);
    setFilteredEntries(filtered);
    setFilterByDate('');
  };

  const handleExportMonthlyData = () => {
    if (monthlyFilteredEntries.length === 0) {
      alert('No filtered entries to export. Please apply filter first.');
      return;
    }

    const exportData = monthlyFilteredEntries.map(entry => ({
      'Date': entry.date,
      'Ticket Number': entry.ticketNumber,
      'Ticket Statement': entry.ticketStatement,
      'Status': entry.ticketStatus,
      'QA Member': entry.qaTeamMember,
      'Missing Content': entry.missingContent,
      'Broken Links': entry.brokenLinks,
      'SEO Issues': entry.seoIssues,
      'Alt Text Issues': entry.altTextIssues,
      'ARIA/CTA Issues': entry.ariaLabelIssues,
      'Trademark Issues': entry.trademarkIssues,
      'Disclosure Issues': entry.disclosureIssues,
      'Other Issues': entry.otherIssues,
      'Total Issues': entry.totalIssues,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Data');

    const fromDateFormatted = new Date(monthlyExportFromDate).toLocaleDateString('en-IN').replace(/\//g, '-');
    const toDateFormatted = new Date(monthlyExportToDate).toLocaleDateString('en-IN').replace(/\//g, '-');
    const fileName = `Daily_Status_${fromDateFormatted}_to_${toDateFormatted}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleDownloadBackup = () => {
    const backupData = {
      entries: entries,
      qaMembers: qaMembers,
      backupDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Daily_Status_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert('Backup downloaded successfully!');
  };

  const handleRestoreBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const backupData = JSON.parse(event.target.result);

        if (!backupData.entries || !backupData.qaMembers) {
          alert('Invalid backup file format');
          return;
        }

        setEntries(backupData.entries);
        setQaMembers(backupData.qaMembers);
        localStorage.setItem('dailyEntries', JSON.stringify(backupData.entries));
        localStorage.setItem('qaMembers', JSON.stringify(backupData.qaMembers));

        alert('Backup restored successfully!');
        setShowBackupModal(false);
      } catch (error) {
        alert('Error reading backup file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportDailyEntries = () => {
    const dataToExport = filteredEntries.length > 0 ? filteredEntries : entries;

    if (dataToExport.length === 0) {
      alert('No entries to export');
      return;
    }

    const exportData = dataToExport.map(entry => ({
      'Date': entry.date,
      'Ticket Number': entry.ticketNumber,
      'Ticket Statement': entry.ticketStatement,
      'Status': entry.ticketStatus,
      'QA Member': entry.qaTeamMember,
      'Missing Content': entry.missingContent,
      'Broken Links': entry.brokenLinks,
      'SEO Issues': entry.seoIssues,
      'Alt Text Issues': entry.altTextIssues,
      'ARIA/CTA Issues': entry.ariaLabelIssues,
      'Trademark Issues': entry.trademarkIssues,
      'Disclosure Issues': entry.disclosureIssues,
      'Other Issues': entry.otherIssues,
      'Total Issues': entry.totalIssues,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Entries');

    const fileName = filterByDate
      ? `Daily_Status_${filterByDate}.xlsx`
      : `Daily_Status_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportToText = () => {
    if (!filterByDate) {
      alert('Please select a date first');
      return;
    }

    const selectedDateFormatted = new Date(filterByDate).toLocaleDateString('en-IN');
    const dateEntries = entries.filter(entry => entry.date === selectedDateFormatted);

    if (dateEntries.length === 0) {
      alert('No entries found for the selected date');
      return;
    }

    let textContent = `Daily Status Report - ${selectedDateFormatted}\n`;
    textContent += `${'='.repeat(80)}\n\n`;

    dateEntries.forEach((entry) => {
      textContent += `${entry.ticketNumber} - ${entry.ticketStatement} - QA Status-${entry.ticketStatus}\n`;
    });

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(textContent));
    element.setAttribute('download', `Daily_Status_${selectedDateFormatted.replace(/\//g, '-')}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportToExcel = () => {
    if (entries.length === 0) {
      alert('No entries to export');
      return;
    }

    const exportData = entries.map(entry => ({
      'Date': entry.date,
      'Ticket Number': entry.ticketNumber,
      'Ticket Statement': entry.ticketStatement,
      'Status': entry.ticketStatus,
      'QA Member': entry.qaTeamMember,
      'Missing Content': entry.missingContent,
      'Broken Links': entry.brokenLinks,
      'SEO Issues': entry.seoIssues,
      'Alt Text Issues': entry.altTextIssues,
      'ARIA/CTA Issues': entry.ariaLabelIssues,
      'Trademark Issues': entry.trademarkIssues,
      'Disclosure Issues': entry.disclosureIssues,
      'Other Issues': entry.otherIssues,
      'Total Issues': entry.totalIssues,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Status');

    const fileName = `Daily_Status_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Show name entry modal if user is not logged in
  if (showNameModal && !currentUser) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Name Entry Modal */}
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black rounded-lg p-8 max-w-md w-full">
            <h2 className="text-3xl font-bold text-black mb-2">Daily Status Report</h2>
            <p className="text-gray-600 mb-6">Enter your name to continue</p>

            <div className="mb-6">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                placeholder="Your name"
                className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400 text-lg"
                autoFocus
              />
            </div>

            <button
              onClick={handleNameSubmit}
              className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-white ${sidebarOpen ? 'overflow-hidden' : ''}`}>
      {/* Header */}
      <div className="py-6 px-8 border-b-2 border-gray-300 bg-gradient-to-r from-white to-blue-50 flex items-center gap-8 justify-between shadow-sm" style={{marginLeft: '60px', marginRight: '60px', minHeight: '140px'}}>
        <div className="flex items-center gap-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="Toggle menu"
          >
            {sidebarOpen ? <X size={40} /> : <Menu size={40} />}
          </button>
          <div>
            <h1 className="text-5xl font-bold text-gray-900">
              {currentPage === 'home' && 'Daily Status Report'}
              {currentPage === 'dashboard' && 'Dashboard'}
              {currentPage === 'qa-management' && 'QA Management'}
              {currentPage === 'export' && 'Export Data'}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              {currentPage === 'home' && 'Track daily work progress and manage QA issues'}
              {currentPage === 'dashboard' && 'Monthly issues summary and statistics'}
              {currentPage === 'qa-management' && 'Manage QA team members'}
              {currentPage === 'export' && 'Export your entries in various formats'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {currentPage === 'home' && (
            <>
              <div className="bg-white rounded-lg px-6 py-4 border-2 border-gray-300 shadow-md hover:shadow-lg transition">
                <label className="block text-gray-800 font-bold mb-3 text-base">📅 Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black cursor-pointer bg-white text-lg font-semibold"
                />
              </div>
              <button
                onClick={() => setShowBackupModal(true)}
                className="bg-purple-600 text-white font-bold py-3 px-7 rounded-lg hover:bg-purple-700 transition text-base shadow-md hover:shadow-lg"
                title="Backup & Restore Data"
              >
                💾 Backup
              </button>
              <button
                onClick={async () => {
                  const result = await selectOneDriveFolder();
                  if (result.success) {
                    setOneDriveFolderPath(result.path);
                    setSyncStatus('connected');
                    alert('✅ OneDrive folder selected and synced!');
                  }
                }}
                className={`font-bold py-3 px-7 rounded-lg transition flex items-center gap-3 text-base shadow-md hover:shadow-lg ${
                  syncStatus === 'connected'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Select OneDrive folder for sync"
              >
                <Cloud size={22} />
                {syncStatus === 'connected' ? 'Synced' : 'Sync'}
              </button>
            </>
          )}

          {/* User Avatar Dropdown */}
          <div className="relative ml-8 mr-2">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 text-white font-bold rounded-full flex items-center justify-center hover:shadow-lg transition text-2xl border-3 border-blue-700 shadow-md"
              title="User menu"
            >
              {(typeof currentUser === 'object' ? currentUser?.username : currentUser)?.charAt(0).toUpperCase()}
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b-2 border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <p className="text-gray-700 font-bold text-sm">👤 Logged in as</p>
                  <p className="text-gray-900 font-bold text-base">{typeof currentUser === 'object' ? currentUser?.username : currentUser}</p>
                </div>
                {typeof currentUser === 'object' && (
                  <button
                    onClick={() => {
                      handleRefreshPermissions();
                    }}
                    className="w-full text-left px-4 py-3 text-blue-600 font-bold hover:bg-blue-50 transition flex items-center gap-2 text-base border-t border-gray-200"
                  >
                    🔄 Refresh Permissions
                  </button>
                )}
                <button
                  onClick={() => {
                    handleUserLogout();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 font-bold hover:bg-red-50 transition flex items-center gap-2 text-base border-t border-gray-200"
                >
                  <LogOut size={18} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-6 bg-gray-50"></div>

      {/* Main flex container */}
      <div className="flex flex-1">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <>
            {/* Background Overlay */}
            <div
              className="fixed inset-0 bg-white bg-opacity-50 z-40 transition-opacity duration-300"
              onClick={() => setSidebarOpen(false)}
              style={{top: '164px'}}
            ></div>
            {/* Sidebar */}
            <div className="fixed w-80 bg-white shadow-2xl z-50 overflow-y-auto border-r-2 border-gray-200 flex flex-col" style={{top: '164px', bottom: 0, left: '60px', right: '60px'}}>
              {/* Header */}
              <div className="bg-gradient-to-r from-white to-blue-50 px-8 py-8 border-b-2 border-gray-200">
                <h1 className="text-gray-900 text-3xl font-bold">Navigation</h1>
                <p className="text-gray-600 text-base mt-2">Access all sections</p>
              </div>

              {/* Navigation Items */}
              <nav className="p-6 space-y-3 flex-1">
                {[
                  { id: 'home', label: 'Home', icon: '🏠' },
                  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                  { id: 'qa-management', label: 'QA Management', icon: '👥' },
                  { id: 'export', label: 'Export Data', icon: '📥' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-6 py-4 rounded-lg transition-all duration-300 font-semibold text-lg flex items-center gap-4 border-2 ${
                      currentPage === item.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              {/* Divider */}
              <div className="px-6 py-2">
                <div className="h-px bg-gray-200"></div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-white to-gray-50 border-t-2 border-gray-200 px-6 py-6">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full bg-gray-200 text-gray-900 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 transition-all duration-300 text-base"
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </>
        )}

        {/* Main content area */}
        <div className="flex-1 p-8">
          <div className="max-w-full mx-auto" style={{marginLeft: '60px', marginRight: '60px'}}>

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <>
        {/* Header Controls */}
        <div className="mb-8" style={{marginLeft: '60px', marginRight: '60px'}}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-3 items-end">
            </div>
          </div>
        </div>
         
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12" style={{marginLeft: '60px', marginRight: '60px'}}>
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {/* Main Form Card */}
            <div className="bg-white border border-gray-300 rounded-xl p-10 mb-8 shadow-lg hover:shadow-xl transition">
              <h2 className="text-3xl font-bold text-black mb-6"></h2>

              {/* Ticket Info */}
              <div className="mb-8">
                <label className="block text-gray-900 font-bold mb-3 text-lg">Ticket Number <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  name="ticketNumber"
                  value={formData.ticketNumber}
                  onChange={handleInputChange}
                  placeholder="Enter ticket number"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500 text-lg"
                />
              </div>

              {/* Ticket Statement */}
              <div className="mb-8">
                <label className="block text-gray-900 font-bold mb-3 text-lg">Ticket Statement <span className="text-red-600">*</span></label>
                <textarea
                  name="ticketStatement"
                  value={formData.ticketStatement}
                  onChange={handleInputChange}
                  placeholder="Describe the ticket"
                  rows="2"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500 text-lg resize-none"
                />
              </div>

              {/* Dropdowns Row */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-gray-900 font-bold mb-3 text-lg">QA Team Member</label>
                  <select
                    name="qaTeamMember"
                    value={formData.qaTeamMember}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg"
                  >
                    <option value="">Select QA Member</option>
                    {qaMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-900 font-bold mb-3 text-lg">Ticket Status</label>
                  <select
                    name="ticketStatus"
                    value={formData.ticketStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-lg"
                  >
                    <option value="">Select Status</option>
                    <option value="First Pass">First Pass</option>
                    <option value="Issues Reported">Issues Reported</option>
                    <option value="PASS">PASS</option>
                    <option value="WIP">WIP</option>
                    <option value="Comment Added">Comment Added</option>
                    <option value="New Issues Reported">New Issues Reported</option>
                    <option value="Few Issues Reproducible">Few Issues Reproducible</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-8">
                <label className="block text-gray-900 font-bold mb-3 text-lg">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => {
                    handleInputChange(e);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                  }}
                  placeholder="Add any additional notes (optional)"
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500 text-lg resize-none overflow-y-auto"
                  style={{ minHeight: '100px', maxHeight: '300px', transition: 'height 0.2s ease' }}
                />
              </div>

              {/* Add Entry Button */}
              <div className="mt-10">
                <button
                  onClick={handleAddEntry}
                  disabled={!canAdd}
                  className={`w-full font-bold py-4 px-6 rounded-lg transition text-base shadow-md hover:shadow-lg ${
                    canAdd
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  title={!canAdd ? '❌ You do not have permission to add entries' : ''}
                >
                  {editingId ? '✅ Update Entry' : '➕ Add Daily Work'}
                </button>
                {!canAdd && (
                  <p className="text-red-600 text-sm font-semibold mt-2 text-center">❌ You do not have permission to add entries</p>
                )}
              </div>

              {/* Action Buttons (Cancel) */}
              <div className="flex gap-4 mt-6">
                {editingId && (
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Stats */}
          <div>
            {/* Summary Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 sticky top-8 border border-blue-300 shadow-lg">
              <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">📊 Summary</h3>

              <div className="space-y-4">
                <div className="bg-white rounded-lg p-5 border border-blue-100 hover:shadow-md transition">
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">📅 Selected Date</p>
                  <p className="text-lg font-bold text-blue-900">
                    {new Date(selectedDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-blue-100 hover:shadow-md transition">
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">📋 Total Entries</p>
                  <p className="text-3xl font-bold text-blue-900">{entries.length}</p>
                </div>

                <div className="bg-white rounded-lg p-5 border border-blue-100 hover:shadow-md transition">
                  <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">👥 QA Members</p>
                  <p className="text-3xl font-bold text-blue-900">{qaMembers.length}</p>
                </div>

                {entries.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-5 border border-orange-300">
                    <p className="text-orange-700 text-xs font-bold uppercase tracking-wider mb-2">⚠️ Total Issues</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {entries.reduce((sum, entry) => sum + entry.totalIssues, 0)}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
        {/* Spacer */}
      <div className="h-12 bg-gray-50"></div>

        {/* Entries Table */}
        {entries.length > 0 && (
          <div className="mt-12" style={{marginLeft: '60px', marginRight: '60px'}}>
            <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-8">All Entries</h2>

              {/* Search Section */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2 text-sm">🔍 Search by Ticket</label>
                    <input
                      type="text"
                      value={ticketSearch}
                      onChange={(e) => setTicketSearch(e.target.value)}
                      placeholder="Enter ticket number..."
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-2 text-sm">👤 Search by QA Member</label>
                    <input
                      type="text"
                      value={qaNameSearch}
                      onChange={(e) => setQaNameSearch(e.target.value)}
                      placeholder="Enter QA member name..."
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-5">
                  <button
                    onClick={() => {
                      setTicketSearch('');
                      setQaNameSearch('');
                    }}
                    className="bg-gray-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-gray-600 transition text-sm"
                  >
                    ✕ Clear Search
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-gray-200 shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                      <th className="px-4 py-3 text-left font-bold text-sm">Date</th>
                      <th className="px-4 py-3 text-left font-bold text-sm">Ticket</th>
                      <th className="px-4 py-3 text-left font-bold text-sm">Statement</th>
                      <th className="px-4 py-3 text-left font-bold text-sm">Status</th>
                      <th className="px-4 py-3 text-left font-bold text-sm">QA</th>
                      <th className="px-4 py-3 text-center font-bold text-sm bg-yellow-600">Total Issues</th>
                      <th className="px-4 py-3 text-center font-bold text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries
                      .filter(entry =>
                        entry.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) &&
                        entry.qaTeamMember.toLowerCase().includes(qaNameSearch.toLowerCase())
                      )
                      .map((entry, idx) => (
                      <tr key={entry.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition border-b border-gray-200`}>
                        <td className="px-4 py-3 text-black text-sm font-medium">{entry.date}</td>
                        <td className="px-4 py-3 text-black font-bold text-sm">{entry.ticketNumber}</td>
                        <td className="px-4 py-3 text-black text-sm" style={{maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={entry.ticketStatement}>{entry.ticketStatement}</td>
                        <td className="px-4 py-3 text-black">
                          <span className={`inline-block px-3 py-1 text-sm font-bold ${
                            entry.ticketStatus === 'Issues Reported'
                              ? 'text-red-700'
                              : entry.ticketStatus === 'PASS'
                              ? 'text-green-700'
                              : entry.ticketStatus === 'First Pass'
                              ? 'text-blue-700'
                              : 'text-gray-700'
                          }`}>
                            {entry.ticketStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-black font-semibold text-sm">{entry.qaTeamMember}</td>
                        <td className="px-4 py-3 text-center text-black font-bold text-sm bg-yellow-100 rounded">{entry.totalIssues}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => handleEdit(entry)}
                                className="bg-blue-100 text-blue-600 hover:bg-blue-200 transition font-bold p-2 rounded-lg"
                                title="Edit entry"
                              >
                                <Edit2 size={18} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="bg-red-100 text-red-600 hover:bg-red-200 transition font-bold p-2 rounded-lg"
                                title="Delete entry"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                            {!canEdit && !canDelete && (
                              <span className="text-gray-500 text-sm font-semibold px-2">🔒 Read-only</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-black rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-black mb-6">Edit Entry</h2>

              {/* Ticket Info */}
              <div className="mb-6">
                <label className="block text-black font-semibold mb-2">Ticket Number <span className="text-red-600">*</span></label>
                <input
                  type="text"
                  name="ticketNumber"
                  value={formData.ticketNumber}
                  onChange={handleInputChange}
                  placeholder="Enter Ticket number"
                  required
                  className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
                />
              </div>

              {/* Ticket Statement */}
              <div className="mb-6">
                <label className="block text-black font-semibold mb-2">Ticket Statement <span className="text-red-600">*</span></label>
                <textarea
                  name="ticketStatement"
                  value={formData.ticketStatement}
                  onChange={handleInputChange}
                  placeholder="Enter Ticket statement"
                  rows="3"
                  required
                  className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400"
                />
              </div>

              {/* Dropdowns Row */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-black font-semibold mb-2">QA Team Member</label>
                  <select
                    name="qaTeamMember"
                    value={formData.qaTeamMember}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                  >
                    <option value="">-- Select QA Member --</option>
                    {qaMembers.map(member => (
                      <option key={member} value={member}>{member}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-black font-semibold mb-2">Ticket Status</label>
                  <select
                    name="ticketStatus"
                    value={formData.ticketStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                  >
                    <option value=""></option>
                    <option value="First Pass">First Pass</option>
                    <option value="Issues Reported">Issues Reported</option>
                    <option value="PASS">PASS</option>
                    <option value="WIP">WIP</option>
                    <option value="Comment Added">Comment Added</option>
                    <option value="New Issues Reported">New Issues Reported</option>
                    <option value="Few Issues Reproducible">Few Issues Reproducible</option>
                  </select>
                </div>
              </div>

              {/* Issues Section */}
              <div className="bg-gray-300 p-4 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-black mb-4">Issue Tracking</h3>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">Missing Content</label>
                    <input
                      type="number"
                      name="missingContent"
                      value={formData.missingContent}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">Broken Links</label>
                    <input
                      type="number"
                      name="brokenLinks"
                      value={formData.brokenLinks}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">SEO Issues</label>
                    <input
                      type="number"
                      name="seoIssues"
                      value={formData.seoIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">Alt Text Issues/Image Issues</label>
                    <input
                      type="number"
                      name="altTextIssues"
                      value={formData.altTextIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">ARIA Label Issues/CTA Issues</label>
                    <input
                      type="number"
                      name="ariaLabelIssues"
                      value={formData.ariaLabelIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">Trademark Issues</label>
                    <input
                      type="number"
                      name="trademarkIssues"
                      value={formData.trademarkIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">Disclosure Issues</label>
                    <input
                      type="number"
                      name="disclosureIssues"
                      value={formData.disclosureIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-base">Other (Translations, Typo's, Spacing, etc.)</label>
                    <input
                      type="number"
                      name="otherIssues"
                      value={formData.otherIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black text-base"
                    />
                  </div>
                </div>

                {/* Total Issues */}
                <div>
                  <label className="block text-black font-semibold mb-1 text-base">Total Issues</label>
                  <input
                    type="number"
                    value={totalIssues}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-black rounded-lg bg-gray-100 text-black font-bold text-base"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-black font-semibold mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={(e) => {
                    handleInputChange(e);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                  }}
                  onFocus={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px';
                  }}
                  placeholder="Add any additional notes"
                  rows="2"
                  className="w-full px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-400 resize-none overflow-y-auto"
                  style={{ minHeight: '60px', maxHeight: '300px', transition: 'height 0.2s ease' }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleAddEntry}
                  className="flex-1 bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 bg-gray-400 text-black font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Backup Modal */}
        {showBackupModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white border-2 border-black rounded-lg p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-black mb-6">Backup & Restore</h2>

              <div className="space-y-4">
                {/* Download Backup */}
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-2">📥 Download Backup</h3>
                  <p className="text-black text-sm mb-3">Save all your data as a backup file to your computer</p>
                  <button
                    onClick={handleDownloadBackup}
                    className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
                  >
                    Download Backup
                  </button>
                </div>

                {/* Restore Backup */}
                <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-black mb-2">📤 Restore Backup</h3>
                  <p className="text-black text-sm mb-3">Restore data from a previously saved backup file</p>
                  <label className="w-full">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleRestoreBackup}
                      className="hidden"
                    />
                    <span className="block w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition text-center cursor-pointer">
                      Choose Backup File
                    </span>
                  </label>
                </div>

                {/* Info */}
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                  <p className="text-black text-sm font-semibold">ℹ️ Important:</p>
                  <ul className="text-black text-sm mt-2 list-disc list-inside space-y-1">
                    <li>Data is stored in browser (LocalStorage)</li>
                    <li>Download backup regularly</li>
                    <li>Export to Excel for reports</li>
                    <li>Backup file = Complete data snapshot</li>
                  </ul>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowBackupModal(false)}
                className="w-full mt-6 bg-gray-400 text-black font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
          </>
        )}

        {/* Dashboard Page */}
        {currentPage === 'dashboard' && (
          <div className="p-8" style={{marginLeft: '60px', marginRight: '60px'}}>

            {/* Month Selector */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-8">
              <label className="block text-black font-semibold mb-2">Select Month</label>
              <select
                value={issuesSummaryMonth}
                onChange={(e) => setIssuesSummaryMonth(e.target.value)}
                className="px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black cursor-pointer bg-white"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(new Date().getFullYear(), i, 1);
                  const monthYear = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
                  return (
                    <option key={i} value={`${date.getFullYear()}-${String(i + 1).padStart(2, '0')}`}>
                      {monthYear}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Issues Reported Card */}
              <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-red-700 font-semibold text-base uppercase tracking-wider">Issues Reported</p>
                    <p className="text-5xl font-bold text-red-600 mt-3">
                      {issuesSummaryMonth
                        ? entries
                            .filter((e) => {
                              const entryDate = new Date(e.date.split('/').reverse().join('-'));
                              const [year, month] = issuesSummaryMonth.split('-');
                              return entryDate.getFullYear() === parseInt(year) &&
                                     entryDate.getMonth() === parseInt(month) - 1 &&
                                     e.ticketStatus === 'Issues Reported';
                            })
                            .length
                        : entries.filter((e) => e.ticketStatus === 'Issues Reported').length}
                    </p>
                  </div>
                  <div className="text-5xl">📊</div>
                </div>
              </div>

              {/* Pass Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-green-700 font-semibold text-base uppercase tracking-wider">Passed</p>
                    <p className="text-5xl font-bold text-green-600 mt-3">
                      {issuesSummaryMonth
                        ? entries
                            .filter((e) => {
                              const entryDate = new Date(e.date.split('/').reverse().join('-'));
                              const [year, month] = issuesSummaryMonth.split('-');
                              return entryDate.getFullYear() === parseInt(year) &&
                                     entryDate.getMonth() === parseInt(month) - 1 &&
                                     e.ticketStatus === 'PASS';
                            })
                            .length
                        : entries.filter((e) => e.ticketStatus === 'PASS').length}
                    </p>
                  </div>
                  <div className="text-5xl">✅</div>
                </div>
              </div>

              {/* First Pass Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-8 shadow-lg hover:shadow-xl transition">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-700 font-semibold text-base uppercase tracking-wider">First Pass</p>
                    <p className="text-5xl font-bold text-blue-600 mt-3">
                      {issuesSummaryMonth
                        ? entries
                            .filter((e) => {
                              const entryDate = new Date(e.date.split('/').reverse().join('-'));
                              const [year, month] = issuesSummaryMonth.split('-');
                              return entryDate.getFullYear() === parseInt(year) &&
                                     entryDate.getMonth() === parseInt(month) - 1 &&
                                     e.ticketStatus === 'First Pass';
                            })
                            .length
                        : entries.filter((e) => e.ticketStatus === 'First Pass').length}
                    </p>
                  </div>
                  <div className="text-4xl">🎯</div>
                </div>
              </div>
            </div>

            {/* Issues Summary Section */}
            <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-xl border-2 border-orange-200 shadow-lg">
              <h3 className="text-2xl font-bold text-orange-900 flex items-center gap-2 mb-6">⚠️ Issues Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-4">
                {[
                  { label: 'Missing Content', key: 'missingContent', icon: '📝' },
                  { label: 'Broken Links', key: 'brokenLinks', icon: '🔗' },
                  { label: 'SEO Issues', key: 'seoIssues', icon: '🔍' },
                  { label: 'Alt Text', key: 'altTextIssues', icon: '🖼️' },
                  { label: 'ARIA/CTA', key: 'ariaLabelIssues', icon: '♿' },
                  { label: 'Trademark', key: 'trademarkIssues', icon: '™️' },
                  { label: 'Disclosure', key: 'disclosureIssues', icon: '📢' },
                  { label: 'Other', key: 'otherIssues', icon: '📌' },
                  { label: 'Total', key: 'totalIssues', icon: '📌' },
                ].map((issue) => {
                  let displayEntries = entries;

                  if (issuesSummaryMonth) {
                    const [year, month] = issuesSummaryMonth.split('-');
                    displayEntries = entries.filter(entry => {
                      const entryDate = new Date(entry.date.split('/').reverse().join('-'));
                      return entryDate.getFullYear() === parseInt(year) &&
                             entryDate.getMonth() === parseInt(month) - 1;
                    });
                  }

                  const total = displayEntries.reduce((sum, entry) => sum + (entry[issue.key] || 0), 0);

                  return (
                    <div key={issue.key} className="bg-white rounded-lg p-4 border-2 border-orange-100 hover:border-orange-400 hover:shadow-md transition text-center">
                      <p className="text-3xl mb-2">{issue.icon}</p>
                      <p className="text-base font-semibold text-orange-700 mb-2">{issue.label}</p>
                      <p className="text-3xl font-bold text-orange-900">{total}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* QA MANAGEMENT PAGE */}
        {currentPage === 'qa-management' && (
          <div className="p-8" style={{marginLeft: '60px', marginRight: '60px'}}>

            {/* QA Team Management Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-gray-300 rounded-xl p-8 mb-8 shadow-lg">
              <h2 className="text-3xl font-bold text-black mb-6">Add Team Member</h2>
              <div className="flex gap-4 mb-8">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                  placeholder="Enter member name"
                  className="flex-1 px-4 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-lg"
                />
                <button
                  onClick={handleAddMember}
                  className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition text-lg"
                >
                  ➕ Add Member
                </button>
              </div>

              {/* Members List */}
              <h2 className="text-3xl font-bold text-black mb-6">Team Members ({qaMembers.length})</h2>
              {qaMembers.length === 0 ? (
                <p className="text-gray-600 text-center py-12 text-lg">No team members added yet.</p>
              ) : (
                <div className="space-y-3">
                  {qaMembers.map((member) => (
                    <div key={member} className="flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200 hover:shadow-md transition">
                      <span className="text-black font-bold text-lg">👤 {member}</span>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="bg-red-600 text-white font-bold py-2 px-5 rounded-lg hover:bg-red-700 transition text-base"
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EXPORT PAGE */}
        {currentPage === 'export' && (
          <div className="p-8" style={{marginLeft: '60px', marginRight: '60px'}}>

            {/* Two Column Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Daily Work Entries Filter */}
              <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-gray-300 rounded-xl p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-black mb-6">Daily Work Entries</h2>

                <div className="flex flex-col gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg border-2 border-blue-200 mb-4">
                  <div
                    onClick={(e) => {
                      e.currentTarget.querySelector('input[type="date"]')?.showPicker?.();
                    }}
                    className="cursor-pointer"
                  >
                    <label className="block text-black font-bold mb-2 text-sm uppercase tracking-wider cursor-pointer">📅 Select Date</label>
                    <input
                      type="date"
                      value={filterByDate}
                      onChange={(e) => {
                        setFilterByDate(e.target.value);
                        if (e.target.value) {
                          const selectedDate = new Date(e.target.value);
                          const filtered = entries.filter(entry => {
                            const entryDate = new Date(entry.date.split('/').reverse().join('-'));
                            return entryDate.toDateString() === selectedDate.toDateString();
                          });
                          setFilteredEntries(filtered);
                        } else {
                          setFilteredEntries([]);
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black cursor-pointer bg-white font-medium text-lg"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setFilterByDate('');
                        setFilteredEntries([]);
                      }}
                      className="flex-1 bg-gray-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition text-base"
                      title="Clear filter"
                    >
                      ✕ Clear
                    </button>

                    <button
                      onClick={handleExportDailyEntries}
                      disabled={filteredEntries.length === 0}
                      className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
                      title="Download as Excel"
                    >
                      <Download size={20} />
                      Excel
                    </button>

                    <button
                      onClick={handleExportToText}
                      disabled={filteredEntries.length === 0}
                      className="flex-1 bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-base"
                      title="Download as Text"
                    >
                      📄 Text
                    </button>
                  </div>
                </div>
              </div>

              {/* Monthly Data Export */}
              <div className="bg-gradient-to-br from-white to-green-50 border-2 border-gray-300 rounded-xl p-8 shadow-lg">
                <h2 className="text-3xl font-bold text-black mb-6">Monthly Data Export</h2>

                <div className="flex flex-col gap-4 bg-gradient-to-r from-green-50 to-emerald-50 p-5 rounded-lg border-2 border-green-200 mb-4">
                  <div
                    onClick={(e) => {
                      e.currentTarget.querySelector('input[type="date"]')?.showPicker?.();
                    }}
                    className="cursor-pointer"
                  >
                    <label className="block text-black font-bold mb-2 text-sm uppercase tracking-wider cursor-pointer">📅 From Date</label>
                    <input
                      type="date"
                      value={monthlyExportFromDate}
                      onChange={(e) => {
                        setMonthlyExportFromDate(e.target.value);
                        if (monthlyExportFromDate && monthlyExportToDate) {
                          handleFilterByMonth();
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-black cursor-pointer bg-white font-medium text-lg"
                    />
                  </div>

                  <div
                    onClick={(e) => {
                      e.currentTarget.querySelector('input[type="date"]')?.showPicker?.();
                    }}
                    className="cursor-pointer"
                  >
                    <label className="block text-black font-bold mb-2 text-sm uppercase tracking-wider cursor-pointer">📅 To Date</label>
                    <input
                      type="date"
                      value={monthlyExportToDate}
                      onChange={(e) => {
                        setMonthlyExportToDate(e.target.value);
                        if (monthlyExportFromDate && e.target.value) {
                          handleFilterByMonth();
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 text-black cursor-pointer bg-white font-medium text-lg"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setMonthlyExportFromDate('');
                        setMonthlyExportToDate('');
                        setMonthlyFilteredEntries([]);
                      }}
                      className="flex-1 bg-gray-400 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition text-base"
                      title="Clear monthly filter"
                    >
                      ✕ Clear
                    </button>

                    <button
                      onClick={handleExportMonthlyData}
                      disabled={monthlyFilteredEntries.length === 0}
                      className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-base flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Export
                    </button>
                  </div>
                </div>

                {monthlyFilteredEntries.length > 0 && (
                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-5">
                    <p className="text-black font-bold text-base">Filtered Results: <span className="text-blue-600 text-lg">{monthlyFilteredEntries.length}</span> entries found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Entries Table Below - Only shows when date is selected */}
            {filteredEntries.length > 0 && (
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mt-8">
                <h2 className="text-2xl font-bold text-black mb-4">Daily Entries ({filteredEntries.length})</h2>

                <div className="overflow-x-auto rounded-lg border-2 border-gray-200 shadow-sm">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                        <th className="px-4 py-3 text-left font-bold text-sm">Date</th>
                        <th className="px-4 py-3 text-left font-bold text-sm">Ticket</th>
                        <th className="px-4 py-3 text-left font-bold text-sm">Statement</th>
                        <th className="px-4 py-3 text-left font-bold text-sm">Status</th>
                        <th className="px-4 py-3 text-left font-bold text-sm">QA</th>
                        <th className="px-4 py-3 text-center font-bold text-sm bg-yellow-600">Total Issues</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.map((entry, idx) => (
                        <tr key={entry.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition border-b border-gray-200`}>
                          <td className="px-4 py-3 text-black text-sm font-medium">{entry.date}</td>
                          <td className="px-4 py-3 text-black font-bold text-sm">{entry.ticketNumber}</td>
                          <td className="px-4 py-3 text-black text-sm" style={{maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={entry.ticketStatement}>{entry.ticketStatement}</td>
                          <td className="px-4 py-3 text-black">
                            <span className={`inline-block px-3 py-1 text-sm font-bold ${
                              entry.ticketStatus === 'Issues Reported'
                                ? 'text-red-700'
                                : entry.ticketStatus === 'PASS'
                                ? 'text-green-700'
                                : entry.ticketStatus === 'First Pass'
                                ? 'text-blue-700'
                                : 'text-gray-700'
                            }`}>
                              {entry.ticketStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-black font-semibold text-sm">{entry.qaTeamMember}</td>
                          <td className="px-4 py-3 text-center text-black font-bold text-sm bg-yellow-100 rounded">{entry.totalIssues}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACCESS CONTROL PAGE */}
          </div>
        </div>
      </div>
    </div>
  );
}
