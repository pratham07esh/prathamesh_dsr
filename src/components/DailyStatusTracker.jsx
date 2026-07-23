import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Download, Cloud } from 'lucide-react';
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

  const initializeEntries = () => {
    const saved = localStorage.getItem('dailyEntries');
    return saved ? JSON.parse(saved) : [];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [qaMembers, setQaMembers] = useState(() => initializeQaMembers());
  const [newMember, setNewMember] = useState('');
  const [entries, setEntries] = useState(() => initializeEntries());
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
    localStorage.setItem('dailyEntries', JSON.stringify(entries));
    // Sync to OneDrive
    saveToOneDrive(entries, qaMembers);
  }, [entries]);

  useEffect(() => {
    localStorage.setItem('qaMembers', JSON.stringify(qaMembers));
    // Sync to OneDrive
    saveToOneDrive(entries, qaMembers);
  }, [qaMembers]);

  // Initialize OneDrive on component mount
  useEffect(() => {
    const initOneDrive = async () => {
      const initialized = await initializeOneDriveSync();
      if (initialized) {
        setSyncStatus('connected');
        const folderPath = await getOneDriveFolder();
        setOneDriveFolderPath(folderPath);

        // Load data from OneDrive on startup
        const { entries: oneDriveEntries, qaMembers: oneDriveMembers } = await loadFromOneDrive();

        // Use OneDrive data if available, otherwise keep local
        if (oneDriveEntries.length > 0) {
          setEntries(oneDriveEntries);
        }
        if (oneDriveMembers.length > 0) {
          setQaMembers(oneDriveMembers);
        }

        setDataLoaded(true);
      }

      // Listen for changes from other windows
      window.addEventListener('onedrive-data-changed', async () => {
        const { entries: updatedEntries, qaMembers: updatedMembers } = await loadFromOneDrive();
        setEntries(updatedEntries);
        setQaMembers(updatedMembers);
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
    });
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
      textContent += `${entry.ticketNumber} - ${entry.ticketStatement} - ${entry.ticketStatus}\n`;
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

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-black mb-2">Daily Status Report</h1>
              <p className="text-gray-600">Track daily work progress and manage QA issues</p>
            </div>
            <div className="flex gap-3 items-end">
              <div className="bg-white">
                <label className="block text-black font-semibold mb-2 text-sm">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black cursor-pointer bg-white"
                />
              </div>
              <button
                onClick={() => setShowBackupModal(true)}
                className="bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
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
                className={`font-bold py-2 px-4 rounded-lg transition flex items-center gap-2 ${
                  syncStatus === 'connected'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                title="Select OneDrive folder for sync"
              >
                <Cloud size={18} />
                {syncStatus === 'connected' ? '☁️ Synced' : '☁️ Sync'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Form */}
          <div className="lg:col-span-2">
            {/* Main Form Card */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-black mb-6"></h2>

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
                  placeholder="Enter Ticket Statement"
                  rows="1"
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

              {/* Add Entry Button */}
              <div className="mt-6">
                <button
                  onClick={handleAddEntry}
                  className="w-full bg-black text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-800 transition text-lg"
                >
                  {editingId ? '✅ Update Entry' : '➕ Add Daily Work'}
                </button>
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
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 sticky top-8 border-2 border-indigo-200 mb-6 shadow-md">
              <h3 className="text-2xl font-bold text-indigo-900 mb-5 flex items-center gap-2">📊 Summary</h3>

              <div className="space-y-3">
                <div className="bg-white rounded-lg p-4 border-2 border-indigo-100 hover:shadow-md transition hover:border-indigo-300">
                  <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-2">📅 Selected Date</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {new Date(selectedDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-indigo-100 hover:shadow-md transition hover:border-indigo-300">
                  <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-2">📋 Total Entries</p>
                  <p className="text-3xl font-bold text-indigo-900">{entries.length}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border-2 border-indigo-100 hover:shadow-md transition hover:border-indigo-300">
                  <p className="text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-2">👥 QA Members</p>
                  <p className="text-3xl font-bold text-indigo-900">{qaMembers.length}</p>
                </div>

                {entries.length > 0 && (
                  <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4 border-2 border-orange-300">
                    <p className="text-orange-700 text-xs font-semibold uppercase tracking-wider mb-2">⚠️ Overall Total Issues</p>
                    <p className="text-3xl font-bold text-orange-900">
                      {entries.reduce((sum, entry) => sum + entry.totalIssues, 0)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* QA Team Management Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200 shadow-md">
              <h3 className="text-2xl font-bold text-green-900 mb-5 flex items-center gap-2">👥 QA Team Management</h3>

              <div className="mb-5 flex gap-2">
                <input
                  type="text"
                  value={newMember}
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                  placeholder="Enter member name"
                  className="flex-1 px-4 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black placeholder-gray-500 text-sm font-medium bg-white hover:border-green-400 transition"
                />
                <button
                  onClick={handleAddMember}
                  className="bg-green-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-green-700 transition text-sm shadow-md hover:shadow-lg"
                >
                  ➕ Add
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {qaMembers.length === 0 ? (
                  <p className="text-gray-500 text-sm italic py-4 px-2 w-full text-center">No team members added yet</p>
                ) : (
                  qaMembers.map(member => (
                    <div key={member} className="bg-green-600 text-white px-4 py-2 rounded-full flex items-center gap-3 text-sm font-semibold shadow-md hover:shadow-lg transition group">
                      <span className="bg-white text-green-700 px-3 py-1 rounded-full font-bold text-xs">{member}</span>
                      <button
                        onClick={() => handleDeleteMember(member)}
                        className="text-white hover:text-red-300 transition opacity-70 group-hover:opacity-100 font-bold"
                        title="Delete member"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>

              {qaMembers.length > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-green-300">
                  <p className="text-green-700 text-xs font-semibold uppercase tracking-wider">Total Members: <span className="text-green-900 text-lg font-bold">{qaMembers.length}</span></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Export Section */}
        <div className="mt-8">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-black mb-4">Monthly Data Export</h2>

            <div className="flex flex-col lg:flex-row gap-3 items-end bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex-1 min-w-0">
                <label className="block text-black font-semibold mb-2 text-xs uppercase tracking-wider">📅 From Date</label>
                <input
                  type="date"
                  value={monthlyExportFromDate}
                  onChange={(e) => setMonthlyExportFromDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black cursor-pointer bg-white font-medium text-sm"
                />
              </div>

              <div className="flex-1 min-w-0">
                <label className="block text-black font-semibold mb-2 text-xs uppercase tracking-wider">📅 To Date</label>
                <input
                  type="date"
                  value={monthlyExportToDate}
                  onChange={(e) => setMonthlyExportToDate(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black cursor-pointer bg-white font-medium text-sm"
                />
              </div>

              <div className="flex gap-2 w-full lg:w-auto">
                <button
                  onClick={handleFilterByMonth}
                  className="flex-1 lg:flex-none bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  🔍 Filter
                </button>

                <button
                  onClick={() => {
                    setMonthlyExportFromDate('');
                    setMonthlyExportToDate('');
                    setMonthlyFilteredEntries([]);
                    setFilteredEntries([]);
                  }}
                  className="flex-1 lg:flex-none bg-gray-400 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition text-sm"
                  title="Clear monthly filter"
                >
                  ✕ Clear
                </button>

                <button
                  onClick={handleExportMonthlyData}
                  disabled={monthlyFilteredEntries.length === 0}
                  className="flex-1 lg:flex-none bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-1"
                >
                  <Download size={16} />
                  Export Monthly
                </button>
              </div>
            </div>

            {monthlyFilteredEntries.length > 0 && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
                <p className="text-black font-semibold">Filtered Results: <span className="text-blue-600">{monthlyFilteredEntries.length}</span> entries found</p>
              </div>
            )}
          </div>
        </div>

        {/* Entries Table */}
        {entries.length > 0 && (
          <div className="mt-8">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-3xl font-bold text-black">Daily Work Entries</h2>
                    <p className="text-gray-600 text-sm mt-1">View and manage all your daily work entries</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {(filteredEntries.length > 0 ? filteredEntries : entries)
                        .filter(entry =>
                          entry.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) &&
                          entry.qaTeamMember.toLowerCase().includes(qaNameSearch.toLowerCase())
                        ).length}
                    </p>
                    <p className="text-gray-600 text-xs">
                      {ticketSearch || qaNameSearch ? 'Search' : (filteredEntries.length > 0 ? 'Filtered' : 'Total')} Entries
                    </p>
                  </div>
                </div>
                {filteredEntries.length > 0 && (
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-3 rounded">
                    <p className="text-blue-800 font-semibold text-sm">🔍 Showing {filteredEntries.length} filtered entries</p>
                  </div>
                )}
              </div>

              {/* Search and Filter Section - One Line */}
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="flex flex-col lg:flex-row gap-3 items-end justify-between">

                  {/* Left Side - Searches */}
                  <div className="flex gap-3 flex-1 min-w-0">
                    <div className="flex-1">
                      <label className="block text-black font-semibold mb-2 text-xs uppercase tracking-wider">🔍 Search Ticket</label>
                      <input
                        type="text"
                        value={ticketSearch}
                        onChange={(e) => setTicketSearch(e.target.value)}
                        placeholder="Ticket number..."
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder-gray-500 font-medium"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-black font-semibold mb-2 text-xs uppercase tracking-wider">👤 Search QA Name</label>
                      <input
                        type="text"
                        value={qaNameSearch}
                        onChange={(e) => setQaNameSearch(e.target.value)}
                        placeholder="QA member name..."
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black placeholder-gray-500 font-medium"
                      />
                    </div>
                  </div>

                  {/* Right Side - Date and Filters */}
                  <div className="flex flex-col sm:flex-row gap-2 items-end w-full lg:w-auto">
                    <div className="sm:w-48">
                      <label className="block text-black font-semibold mb-2 text-xs uppercase tracking-wider">📅 Date</label>
                      <input
                        type="date"
                        value={filterByDate}
                        onChange={(e) => setFilterByDate(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-black cursor-pointer bg-white font-medium text-sm"
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={handleFilterByDate}
                        className="bg-blue-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-blue-700 transition text-sm"
                        title="Apply filter"
                      >
                        🔍 Filter
                      </button>

                      <button
                        onClick={() => {
                          setFilterByDate('');
                          setFilteredEntries([]);
                          setTicketSearch('');
                          setQaNameSearch('');
                        }}
                        className="bg-gray-400 text-white font-bold py-2 px-3 rounded-lg hover:bg-gray-500 transition text-sm"
                        title="Clear all filters"
                      >
                        ✕ Clear
                      </button>

                      <button
                        onClick={handleExportDailyEntries}
                        className="bg-green-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-green-700 transition text-sm flex items-center gap-1"
                        title="Download as Excel"
                      >
                        <Download size={16} />
                        Export
                      </button>

                      <button
                        onClick={handleExportToText}
                        className="bg-purple-600 text-white font-bold py-2 px-3 rounded-lg hover:bg-purple-700 transition text-sm"
                        title="Download as Text"
                      >
                        📄 Text
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues Summary Section */}
              <div className="mb-8 bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border-2 border-orange-200">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                  <h3 className="text-xl font-bold text-orange-900 flex items-center gap-2">⚠️ Issues Summary</h3>
                  <div className="flex items-center gap-2">
                    <label className="text-black font-semibold text-sm uppercase tracking-wider">📅 Select Month:</label>
                    <select
                      value={issuesSummaryMonth}
                      onChange={(e) => setIssuesSummaryMonth(e.target.value)}
                      className="px-4 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600 text-black bg-white font-medium"
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
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
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

                    const total = displayEntries
                      .filter(entry =>
                        entry.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) &&
                        entry.qaTeamMember.toLowerCase().includes(qaNameSearch.toLowerCase())
                      )
                      .reduce((sum, entry) => sum + (entry[issue.key] || 0), 0);

                    return (
                      <div key={issue.key} className="bg-white rounded-lg p-3 border-2 border-orange-100 hover:border-orange-300 transition text-center">
                        <p className="text-2xl mb-1">{issue.icon}</p>
                        <p className="text-sm font-semibold text-orange-700 mb-1">{issue.label}</p>
                        <p className="text-2xl font-bold text-orange-900">{total}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border-2 border-gray-200 shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                      <th className="px-4 py-4 text-left font-bold text-sm">Date</th>
                      <th className="px-4 py-4 text-left font-bold text-sm">Ticket</th>
                      <th className="px-4 py-4 text-left font-bold text-sm">Statement</th>
                      <th className="px-4 py-4 text-left font-bold text-sm">Status</th>
                      <th className="px-4 py-4 text-left font-bold text-sm"> QA </th>
                      <th className="px-4 py-4 text-center font-bold text-sm">Missing <br />Content</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">Broken <br />Links</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">SEO <br /> Issues</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">Alt Text Issues<br />/Image Issues</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">ARIA Label Issues<br />/CTA Issues</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">Trademark<br /> Issues</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">Disclosure <br />Issues</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">Other</th>
                      <th className="px-4 py-4 text-center font-bold text-sm bg-yellow-600">📊 Total</th>
                      <th className="px-4 py-4 text-center font-bold text-sm">⚙️ Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(filteredEntries.length > 0 ? filteredEntries : entries)
                      .filter(entry =>
                        entry.ticketNumber.toLowerCase().includes(ticketSearch.toLowerCase()) &&
                        entry.qaTeamMember.toLowerCase().includes(qaNameSearch.toLowerCase())
                      )
                      .map((entry, idx) => (
                      <tr key={entry.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition border-b border-gray-200`}>
                        <td className="px-4 py-4 text-black text-sm font-medium">{entry.date}</td>
                        <td className="px-4 py-4 text-black font-bold text-sm">{entry.ticketNumber}</td>
                        <td className="px-4 py-4 text-black max-w-xs truncate text-sm" title={entry.ticketStatement}>{entry.ticketStatement}</td>
                        <td className="px-4 py-4 text-black">
                          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                            {entry.ticketStatus}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-black font-semibold text-sm">{entry.qaTeamMember}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.missingContent}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.brokenLinks}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.seoIssues}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.altTextIssues}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.ariaLabelIssues}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.trademarkIssues}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.disclosureIssues}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm">{entry.otherIssues}</td>
                        <td className="px-4 py-4 text-center text-black font-bold text-sm bg-yellow-100 rounded font-bold">{entry.totalIssues}</td>
                        <td className="px-4 py-4 text-center">
                          <div className="flex justify-center gap-3">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="bg-blue-100 text-blue-600 hover:bg-blue-200 transition font-bold p-2 rounded-lg"
                              title="Edit entry"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="bg-red-100 text-red-600 hover:bg-red-200 transition font-bold p-2 rounded-lg"
                              title="Delete entry"
                            >
                              <Trash2 size={18} />
                            </button>
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
                <h3 className="text-lg font-bold text-black mb-4">Issue Tracking</h3>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">Missing Content</label>
                    <input
                      type="number"
                      name="missingContent"
                      value={formData.missingContent}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">Broken Links</label>
                    <input
                      type="number"
                      name="brokenLinks"
                      value={formData.brokenLinks}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">SEO Issues</label>
                    <input
                      type="number"
                      name="seoIssues"
                      value={formData.seoIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">Alt Text Issues/Image Issues</label>
                    <input
                      type="number"
                      name="altTextIssues"
                      value={formData.altTextIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">ARIA Label Issues/CTA Issues</label>
                    <input
                      type="number"
                      name="ariaLabelIssues"
                      value={formData.ariaLabelIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">Trademark Issues</label>
                    <input
                      type="number"
                      name="trademarkIssues"
                      value={formData.trademarkIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">Disclosure Issues</label>
                    <input
                      type="number"
                      name="disclosureIssues"
                      value={formData.disclosureIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-black font-semibold mb-1 text-sm">Other (Translations, Typo's, Spacing, etc.)</label>
                    <input
                      type="number"
                      name="otherIssues"
                      value={formData.otherIssues}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      min="0"
                      className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                    />
                  </div>
                </div>

                {/* Total Issues */}
                <div>
                  <label className="block text-black font-semibold mb-1 text-sm">Total Issues</label>
                  <input
                    type="number"
                    value={totalIssues}
                    readOnly
                    className="w-full px-3 py-2 border-2 border-black rounded-lg bg-gray-100 text-black font-bold"
                  />
                </div>
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
      </div>
    </div>
  );
}
