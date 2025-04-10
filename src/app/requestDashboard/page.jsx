'use client'
import React from 'react'
import { useState, useEffect } from 'react';

const RequestDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [requests, setRequests] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editableStatuses, setEditableStatuses] = useState({});
    const [filters, setFilters] = useState({
        employeeId: '',
        requestType: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        // setIsAdmin(true);
    }, []);

    useEffect(() => {
        fetch('/toy_requests.json')
            .then(response => response.json())
            .then(data => {
                setEmployees(data.employees);
                setRequests(data.requests);
                setDocuments(data.documents);
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        const initialStatuses = {};
        requests.forEach(request => {
            initialStatuses[request.request_id] = request.status;
        });
        setEditableStatuses(initialStatuses);
    }, [requests]);

    const handleStatusChange = (requestId, value) => {
        setEditableStatuses(prev => ({
            ...prev,
            [requestId]: value
        }));
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async (requestId) => {
        try {
            const response = await fetch('/api/requests/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    requestId,
                    status: editableStatuses[requestId]
                })
            });

            if (!response.ok) throw new Error('Update failed');
            
            const updatedRequest = await response.json();
            setRequests(prev => prev.map(req => 
                req.request_id === requestId ? updatedRequest : req
            ));
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    const processedData = requests
        .filter(request => {
            const matchesEmployee = filters.employeeId ? 
                request.employee_id === parseInt(filters.employeeId) : true;
            const matchesType = filters.requestType ?
                request.request_type === filters.requestType : true;
            const matchesStatus = filters.status ?
                request.status === filters.status : true;
            const matchesDate = filters.startDate && filters.endDate ?
                new Date(request.start_date) >= new Date(filters.startDate) &&
                new Date(request.end_date) <= new Date(filters.endDate) : true;
            
            return matchesEmployee && matchesType && matchesStatus && matchesDate;
        })
        .map(request => {
            const employee = employees.find(e => e.employee_id === request.employee_id);
            const requestDocs = documents.filter(d => d.request_id === request.request_id);
            
            return {
                ...request,
                employee_name: employee?.employee_name || 'Unknown',
                documents: requestDocs
            };
        });

    const getDateDisplay = (request) => {
        if (request.request_type === 'lateness' || request.request_type === 'early_leave') {
            return new Date(request.time).toLocaleString();
        }
        return `${request.start_date} to ${request.end_date}`;
    };

    return (
        <div className="w-screen min-h-screen bg-white font-black flex flex-col justify-start gap-10 items-center pb-2.5">
            <div className='text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
                Request Management
            </div>
            
            {/* Filter Section */}
            <div className='bg-transparent rounded-2xl font-extralight flex flex-col md:flex-row justify-around items-center w-full md:w-[90%] p-4 gap-4'>
                <div className='text-black text-2xl'>Filter:</div>
                {isAdmin && (
                <input 
                    className='w-full bg-white text-black p-2 rounded-xl border-1'
                    placeholder='Employee ID'
                    value={filters.employeeId}
                    onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                />
                )}
                
                <select 
                    className='w-full bg-white text-black p-2 rounded-xl border-1'
                    value={filters.requestType}
                    onChange={(e) => handleFilterChange('requestType', e.target.value)}
                >
                    <option value="">All Types</option>
                    <option value="lateness">Lateness</option>
                    <option value="early_leave">Early Leave</option>
                    <option value="paid_holiday">Paid Holiday</option>
                    <option value="unpaid_holiday">Unpaid Holiday</option>
                </select>

                <select 
                    className='w-full bg-white text-black p-2 rounded-xl border-1'
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>

                <div className='w-full flex gap-2'>
                    <input 
                        type='date' 
                        className='w-full bg-white text-black p-2 rounded-xl border-1'
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    />
                    <input 
                        type='date' 
                        className='w-full bg-white text-black p-2 rounded-xl border-1'
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Requests Table */}
            <div className='text-gray-800 text-sm max-h-[800px] bg-transparent overflow-scroll flex flex-col justify-center w-[98%] md:w-[90%]'>
                <div className="min-w-[1500px] h-auto flex flex-col">
                        {/* Table Header */}
                        <div className="bg-[#0377e2] flex flex-row justify-around items-center p-2.5 text-white text-center">
                            <div className="p-3 w-[15%]">Employee</div>
                            <div className="p-3 w-[10%]">Type</div>
                            <div className="p-3 w-[20%]">Date/Range</div>
                            <div className="p-3 w-[15%]">Reason</div>
                            <div className="p-3 w-[20%]">Documents</div>
                            <div className="p-3 w-[10%]">Status</div>
                            {isAdmin && (<div className="p-3 w-[10%]">Action</div>)}
                        </div>

                        {/* Table Rows */}
                        {processedData.map((request, index) => (
                            <div 
                                key={request.request_id}
                                className="flex flex-row items-center justify-around w-full text-center"
                                style={{ backgroundColor: index % 2 ? '#fff' : '#dadada' }}
                            >
                                <div className="p-3 w-[15%]">
                                    {request.employee_name}
                                </div>
                                <div className="p-3 w-[10%]">
                                    {request.request_type.replace('_', ' ')}
                                </div>
                                <div className="p-3 w-[20%]">
                                    {getDateDisplay(request)}
                                </div>
                                <div className="p-3 w-[15%]">
                                    {request.reason}
                                </div>
                                <div className="p-3 w-[20%] underline">
                                    {request.documents.map(doc => (
                                        <a 
                                            key={doc.document_id}
                                            href={`/docs/${doc.file_name}`}
                                            className="block text-gray-800 hover:text-gray-950"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {doc.file_name}
                                        </a>
                                    ))}
                                </div>
                                <div className="p-3 w-[10%]">
                                    {isAdmin ? (
                                        <select
                                            value={editableStatuses[request.request_id]}
                                            onChange={(e) => handleStatusChange(request.request_id, e.target.value)}
                                            className="w-full bg-white text-black p-1 rounded border-1 border-gray-400"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded ${
                                            request.status === 'approved' ? 'bg-green-500' :
                                            request.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}>
                                            {request.status}
                                        </span>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="p-3 w-[10%]">
                                        <button
                                            onClick={() => handleSave(request.request_id)}
                                            className="bg-[#0377e2] hover:bg-[#0057a6] text-white font-bold py-1 px-3 rounded"
                                        >
                                            Save
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                </div>
            </div>
        </div>
    )
}

export default RequestDashboard