'use client'
import React from 'react'
import { useState, useEffect, useMemo } from 'react';
import jwt from 'jsonwebtoken';

const Records = () => {
    const [recordItems, setRecordItems] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editItems, setEditItems] = useState({});
    const [userId, setUserId] = useState("");
    const [employeeId, setEmployeeId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [filters, setFilters] = useState({
        id:"",
        employeeId: "",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log(token);
        if (token) {
            try {
                const decoded = jwt.decode(token);
                console.log(decoded);
                setUserId(decoded.id)
                setFilters({
                    userId,
                    employeeId,
                    startDate,
                    endDate,
                });
                setIsAdmin(decoded.role === 'ADMIN');
                fetchData();
            } catch (error) {
                console.error('Error decoding token:', error);
            }
        }
    }, []);

    const fetchData = () => {
        const query = new URLSearchParams(
            Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v != null && v !== "")
            )
        ).toString();
        
        const url = query ? `/api/records?${query}` : '/api/records';
        // console.log(url);
        fetch(url) 
            .then(response => response.json())
            .then(data => {
                if(data.length) setRecordItems(data);
                else setRecordItems([]);
                // console.log(data);
            })
            .catch(error => {
                console.error('Error loading records:', error);
            });
    }


    const handleUpdate = async (record) => {
        try {
          await fetch('/api/records', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record),
          });

          setEditItems((prev) => ({
            ...prev, [record.id]:false
        })) 

        fetchData();

        } catch (err) {
          console.error(err);
        }
      };

    const handleFieldChange = (id, field, value) => {
        setRecordItems((prev) =>
          prev.map((record) =>
            record.id === id ? { ...record, [field]: value } : record
          )
        );
      };

    return (
        <div className="w-screen min-h-screen bg-white font-black flex flex-col justify-start gap-5 items-center">
            <div className='absolute top-0 z-50 left-0 p-2.5 bg-[#b20303] text-white text-5xl flex flex-row justify-center items-center w-full h-auto'>
                Records
            </div>
            <div className='bg-transparent h-[120px] w-full'></div>
            <div className='bg-transparent rounded-2xl font-extralight flex md:flex-row flex-col justify-around items-center md:w-[90%] w-full h-auto p-2.5 gap-2.5'>
                <div className='text-black text-2xl'>Filter:</div>
                {isAdmin && (
                    <input 
                    onChange={(e)=>setEmployeeId(e.target.value)}
                    className='border-1 w-full bg-white text-black p-2 rounded-xl' placeholder='Employee ID'/>
                )}
                <div className='w-full flex md:flex-row flex-col gap-1 justify-around items-center'>
                    <input 
                    onChange={(e)=>setStartDate(e.target.value)}
                    type='date' className='border-1 md:w-[48%] w-full bg-white text-black p-2 rounded-xl' placeholder='Start Date'/>
                    <input 
                    onChange={(e)=>setEndDate(e.target.value)}
                    type='date' className='border-1 md:w-[48%] w-full bg-white text-black p-2 rounded-xl' placeholder='End Date'/>
                </div>
                <button 
                onClick={() => {
                    setFilters({
                        userId,
                        employeeId,
                        startDate,
                        endDate,
                    });
                }}
                className='bg-[#0377e2] hover:bg-[#0057a6] p-2 md:min-w-[150px] min-w-full rounded-xl text-white'>Search</button>
            </div>

            <div className='text-gray-800 text-sm max-h-[600px] bg-transparent overflow-scroll flex flex-col  w-[98%] md:w-[90%]'>
                <div className="min-w-[1500px] h-auto flex flex-col">
                        {/* Table Header */}
                        <div className="bg-[#0377e2] flex flex-row justify-around items-center p-2.5 text-white text-center">
                            <div className="p-3 w-[10%]">Work Location ID</div>
                            <div className="p-3 w-[10%]">Auth Method</div>
                            <div className="p-3 w-[10%]">Date</div>
                            <div className="p-3 w-[10%]">Check In Time</div>
                            <div className="p-3 w-[10%]">Check Out Time</div>
                            <div className="p-3 w-[10%]">IP Address</div>
                            <div className="p-3 w-[10%]">Is Late</div>
                            <div className="p-3 w-[20%]">Comments</div>
                            <div className="p-3 w-[10%]">Actions</div>
                        </div>

                        {/* Table Rows */}
                        {recordItems.map((record, index) => (
                        <div
                            key={record.id}
                            className="flex flex-row items-center justify-around w-full text-center"
                            style={{ backgroundColor: index % 2 ? '#fff' : '#dadada' }}
                        >
                            <div className="p-3 w-[10%]">{record.workLocationId}</div>
                            <div className="p-3 w-[10%]">{record.authMethod}</div>
                            <div className="p-3 w-[10%]">{record.checkInTime.split('T')[0]}</div>
                            <div className="p-3 w-[10%]">
                                {isAdmin ? (
                                    <input
                                        type="text"
                                        value={record.checkInTime.split('T')[1] || ''}
                                        onChange={(e) => {
                                            let inputText = e.target.value
                                            handleFieldChange(record.id, 'checkInTime', record.checkInTime.split('T')[0] + 'T' + inputText);
                                            setEditItems((prev) => ({
                                                ...prev, [record.id]:true
                                            }))                                
                                        }}
                                        className="w-full bg-white text-black p-1 rounded border-1 border-[#b8b8b8] text-center"
                                    />
                                ) : (
                                    record.checkInTime || '--'
                                )}
                            </div>
                            <div className="p-3 w-[10%]">
                                {isAdmin ? (
                                    <input
                                        type="text"
                                        value={record.checkOutTime ? record.checkOutTime.split('T')[1] : ''}
                                        onChange={(e) => {
                                            let inputText = e.target.value
                                            handleFieldChange(record.id, 'checkOutTime', record.checkInTime.split('T')[0] + 'T' + inputText);
                                            setEditItems((prev) => ({
                                                ...prev, [record.id]:true
                                            }))
                                        }}
                                        className="w-full bg-white text-black p-1 rounded border-1 border-[#b8b8b8] text-center"
                                    />
                                ) : (
                                    record.checkOutTime || '--'
                                )}
                            </div>
                            <div className="p-3 w-[10%]">{record.ipAddress}</div>
                            <div className="p-3 w-[10%]">
                            {isAdmin ? (
                                    <select 
                                        className=' bg-white p-2 rounded-xl border-1 border-gray-300'
                                        value={record.isLate}
                                        onChange={(e) => {
                                            handleFieldChange(record.id, 'isLate', e.target.value);
                                            setEditItems((prev) => ({
                                                ...prev, [record.id]:true
                                            }))
                                        }}
                                    >
                                        <option value="true">True</option>
                                        <option value="false">False</option>
                                    </select>
                                ) : (
                                    record.isLate || '--'
                                )}
                                </div>
                            <div className="p-3 w-[20%]">
                            {isAdmin ? (
                                    <input
                                        type="text"
                                        value={record.comments || ''}
                                        onChange={(e) => {
                                            let inputText = e.target.value
                                            handleFieldChange(record.id, 'comments', inputText);
                                            setEditItems((prev) => ({
                                                ...prev, [record.id]:true
                                            }))
                                        }}
                                        className="w-full bg-white text-black p-1 rounded border-1 border-[#b8b8b8] text-center"
                                    />
                                ) : (
                                    record.comments || '--'
                                )}
                            </div>
                            <div className="p-3 w-[10%] flex flex-col">
                            {
                                isAdmin ? (
                                    <>
                                        <button 
                                        style={{backgroundColor: editItems[record.id] ? "#0377e2" : "#dadada"}}
                                        onClick={() => handleUpdate(record)} className="mb-1 bg-blue-500 text-white px-2 py-1">Update</button>
                                    </>
                                ) : "-"
                            }
                            </div>
                        </div>
                        ))}
                </div>
            </div>
        </div>
    )
}

export default Records