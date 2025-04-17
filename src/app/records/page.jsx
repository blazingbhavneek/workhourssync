'use client'
import React from 'react'
import { useState, useEffect, useMemo } from 'react';
// import jwtDecode from 'jwt-decode';

const Records = () => {
    const [recordItems, setRecordItems] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editItems, setEditItems] = useState({});

    useEffect(() => {
        // Check user role from JWT
        // const token = localStorage.getItem('token');
        // if (token) {
        //     try {
        //         const decoded = jwtDecode(token);
        //         setIsAdmin(decoded.profile === 'admin');
        //     } catch (error) {
        //         console.error('Error decoding token:', error);
        //     }
        // }
        setIsAdmin(true);
    }, []);

    const fetchData = () => {
        fetch('/api/records') // Replace with your actual API endpoint
            .then(response => response.json())
            .then(data => {
                setRecordItems(data);
                console.log(data);
            })
            .catch(error => {
                console.error('Error loading records:', error);
            });
    }

    useEffect(() => {
        fetchData();
    }, []);


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
        <div className="w-screen h-full bg-white font-black flex flex-col justify-around gap-5 items-center">
            <div className='p-2.5 bg-[#b20303] text-white text-5xl flex flex-row justify-center items-center w-full h-auto'>
                Records
            </div>


            <div className='text-gray-800 text-sm max-h-[600px] bg-transparent overflow-scroll flex flex-col  w-[98%] md:w-[90%]'>
                <div className="min-w-[1500px] h-auto flex flex-col">
                        {/* Table Header */}
                        <div className="bg-[#0377e2] flex flex-row justify-around items-center p-2.5 text-white text-center">
                            <div className="p-3 w-[10%]">Work Location ID</div>
                            <div className="p-3 w-[10%]">Auth Method</div>
                            <div className="p-3 w-[10%]">Check In Time</div>
                            <div className="p-3 w-[10%]">Check Out Time</div>
                            <div className="p-3 w-[10%]">IP Address</div>
                            <div className="p-3 w-[10%]">Is Late</div>
                            <div className="p-3 w-[30%]">Comments</div>
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
                            <div className="p-3 w-[10%]">
                                {isAdmin ? (
                                    <input
                                        type="text"
                                        value={record.checkInTime || ''}
                                        onChange={(e) => {
                                            let inputText = e.target.value
                                            handleFieldChange(record.id, 'checkInTime', inputText);
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
                                        value={record.checkOutTime || ''}
                                        onChange={(e) => {
                                            let inputText = e.target.value
                                            handleFieldChange(record.id, 'checkOutTime', inputText);
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
                            <div className="p-3 w-[30%]">
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







{/* 

            <div className='bg-transparent rounded-2xl font-extralight flex md:flex-row flex-col justify-around items-center md:w-[90%] w-full h-auto p-2.5 gap-2.5'>
                <div className='text-black text-2xl'>Filter:</div>
                {isAdmin && (
                    <input className='border-1 w-full bg-white text-black p-2 rounded-xl' placeholder='Employee ID'/>
                )}
                <div className='w-full flex md:flex-row flex-col gap-1 justify-around items-center'>
                    <input type='date' className='border-1 md:w-[48%] w-full bg-white text-black p-2 rounded-xl' placeholder='Start Date'/>
                    <input type='date' className='border-1 md:w-[48%] w-full bg-white text-black p-2 rounded-xl' placeholder='End Date'/>
                </div>
                <button className='bg-[#0377e2] hover:bg-[#0057a6] p-2 md:min-w-[150px] min-w-full rounded-xl text-white'>Search</button>
            </div>
            
            <div className='overflow-hidden flex flex-col justify-center items-center md:w-[90%] w-full max-h-[600px] text-gray-800'>
                <div className="flex flex-col justify-between overflow-scroll w-full h-auto border-solid border-1 border-gray-400">
                    <div className="bg-[#0377e2] flex justify-between items-center w-full p-2.5 text-white">
                        <div className="p-2 flex-1 text-center" style={{ minWidth: isAdmin ? '30%' : '40%' }}>Date</div>
                        <div className="p-2 flex-1 text-center" style={{ minWidth: isAdmin ? '25%' : '30%' }}>Check-In Time</div>
                        <div className="p-2 flex-1 text-center" style={{ minWidth: isAdmin ? '25%' : '30%' }}>Check-Out Time</div>
                        {isAdmin && <div className="p-2 flex-1 text-center" style={{ minWidth: '20%' }}>Action</div>}
                    </div>
                    {processedData.map((item, index) => (
                        <div key={index} className="flex w-full" style={{ backgroundColor: index%2 !=0 ? "#fff" : "#dadada"}}>
                            <div className="p-2 flex-1 border-t text-center" style={{ minWidth: isAdmin ? '30%' : '40%' }}>
                                {item.date}
                            </div>
                            <div className="text-[14px] p-2 flex-1 border-t" style={{ minWidth: isAdmin ? '25%' : '30%' }}>
                                {isAdmin ? (
                                    <input
                                        type="text"
                                        value={editableTimes[item.date]?.checkInTime || ''}
                                        onChange={(e) => handleTimeChange(item.date, 'checkInTime', e.target.value)}
                                        className="w-full bg-white text-black p-1 rounded border-1 border-[#b8b8b8] text-center"
                                    />
                                ) : (
                                    item.checkInTime || '--'
                                )}
                            </div>
                            <div className="text-[12px] p-2 flex-1 border-t" style={{ minWidth: isAdmin ? '25%' : '30%' }}>
                                {isAdmin ? (
                                    <input
                                        type="text"
                                        value={editableTimes[item.date]?.checkOutTime || ''}
                                        onChange={(e) => handleTimeChange(item.date, 'checkOutTime', e.target.value)}
                                        className="w-full bg-white text-black p-1 rounded border-1 border-[#b8b8b8] text-center"
                                    />
                                ) : (
                                    item.checkOutTime || '--'
                                )}
                            </div>
                            {isAdmin && (
                                <div className="p-2 flex-1 border-t text-center" style={{ minWidth: '20%' }}>
                                    <button
                                        onClick={() => handleSave(item.date)}
                                        className="bg-[#0377e2] hover:bg-[#0057a6] text-white font-bold py-1 px-3 rounded"
                                    >
                                        Save
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div> */}
        </div>
    )
}

export default Records