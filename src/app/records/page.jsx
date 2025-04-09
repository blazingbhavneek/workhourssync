'use client'
import React from 'react'
import { useState, useEffect, useMemo } from 'react';
// import jwtDecode from 'jwt-decode';

const Records = () => {
    const [recordItems, setRecordItems] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editableTimes, setEditableTimes] = useState({});

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

    useEffect(() => {
        fetch('/toy_records.json') // Replace with your actual API endpoint
            .then(response => response.json())
            .then(data => {
                setRecordItems(data);
            })
            .catch(error => {
                console.error('Error loading records:', error);
            });
    }, []);

    const processedData = useMemo(() => {
        const groupedData = Object.values(
            recordItems.reduce((acc, item) => {
                if (!acc[item.date]) {
                    acc[item.date] = { date: item.date, checkInTime: '', checkOutTime: '' };
                }
                if (item.checkInTime) {
                    acc[item.date].checkInTime = item.checkInTime;
                } else {
                    acc[item.date].checkOutTime = item.checkOutTime;
                }
                return acc;
            }, {})
        );
        return groupedData.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [recordItems]);

    useEffect(() => {
        // Initialize editable times when data loads
        if (processedData.length > 0) {
            const initialTimes = {};
            processedData.forEach(item => {
                initialTimes[item.date] = {
                    checkInTime: item.checkInTime,
                    checkOutTime: item.checkOutTime
                };
            });
            setEditableTimes(initialTimes);
        }
    }, [processedData]);

    const handleTimeChange = (date, field, value) => {
        setEditableTimes(prev => ({
            ...prev,
            [date]: {
                ...prev[date],
                [field]: value
            }
        }));
    };

    const handleSave = async (date) => {
        try {
            const response = await fetch('/api/records/update', { // Replace with your update endpoint
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    date,
                    ...editableTimes[date]
                })
            });

            if (!response.ok) throw new Error('Update failed');
            
            // Refresh data after successful update
            const newData = await response.json();
            setRecordItems(newData);
        } catch (error) {
            console.error('Error updating record:', error);
        }
    };

    return (
        <div className="w-screen h-full bg-white font-black flex flex-col justify-around gap-5 items-center p-3">
            <div className='text-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto'>
                Records
            </div>
            <div className='bg-[#b20303] rounded-2xl font-extralight flex md:flex-row flex-col justify-around items-center md:w-[90%] w-full h-auto p-2.5 gap-2.5'>
                <div className='text-white text-2xl'>Filter:</div>
                <input className='w-full bg-white text-black p-2 rounded-xl' placeholder='Employee ID'/>
                <div className='w-full flex md:flex-row flex-col gap-1 justify-around items-center'>
                    <input type='date' className='md:w-[48%] w-full bg-white text-black p-2 rounded-xl' placeholder='Start Date'/>
                    <input type='date' className='md:w-[48%] w-full bg-white text-black p-2 rounded-xl' placeholder='End Date'/>
                </div>
                <button className='bg-[#0377e2] hover:bg-[#0057a6] p-2 md:min-w-[150px] min-w-full rounded-2xl text-white'>Search</button>
            </div>
            
            <div className='bg-[#b20303] overflow-hidden flex flex-col justify-center items-center md:w-[90%] w-full max-h-[600px] rounded-2xl'>
                <div className="flex flex-col justify-between overflow-scroll w-full h-auto border-solid border-2 border-white">
                    <div className="flex justify-between items-center w-full m-2.5">
                        <div className="p-2 flex-1 text-left" style={{ minWidth: isAdmin ? '30%' : '40%' }}>Date</div>
                        <div className="p-2 flex-1 text-left" style={{ minWidth: isAdmin ? '25%' : '30%' }}>Check-In Time</div>
                        <div className="p-2 flex-1 text-left" style={{ minWidth: isAdmin ? '25%' : '30%' }}>Check-Out Time</div>
                        {isAdmin && <div className="p-2 flex-1 text-left" style={{ minWidth: '20%' }}>Action</div>}
                    </div>
                    {processedData.map((item, index) => (
                        <div key={index} className="flex w-full" style={{ backgroundColor: index%2 !=0 ? "#b20303" : "#d65252"}}>
                            <div className="p-2 flex-1 border-t" style={{ minWidth: isAdmin ? '30%' : '40%' }}>
                                {item.date}
                            </div>
                            <div className="text-[14px] p-2 flex-1 border-t" style={{ minWidth: isAdmin ? '25%' : '30%' }}>
                                {isAdmin ? (
                                    <input
                                        type="text"
                                        value={editableTimes[item.date]?.checkInTime || ''}
                                        onChange={(e) => handleTimeChange(item.date, 'checkInTime', e.target.value)}
                                        className="w-full bg-white text-black p-1 rounded"
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
                                        className="w-full bg-white text-black p-1 rounded"
                                    />
                                ) : (
                                    item.checkOutTime || '--'
                                )}
                            </div>
                            {isAdmin && (
                                <div className="p-2 flex-1 border-t" style={{ minWidth: '20%' }}>
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
            </div>
        </div>
    )
}

export default Records