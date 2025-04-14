'use client'
import React, { useMemo } from 'react'
import { useState, useEffect } from 'react';

const Users = () => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState([]);
    const [editItems, setEditItems] = useState({});
    const [employeeId, setEmployeeId] = useState("");
    const [role, setRole] = useState("");
    const [workLocationsParam, setWorkLocationsParam] = useState("");

    const [filters, setFilters] = useState({
        employeeId: "",
        role: "",
        workLocationsParam: ""
    });

    useEffect(() => {
        setIsAdmin(true);
    }, []);

    const fetchUsers = () => {
        const query = new URLSearchParams(
            Object.fromEntries(
                Object.entries(filters).filter(([_, v]) => v != null && v !== "")
            )
        ).toString();
        
        const url = query ? `/api/users?${query}` : '/api/users';
        console.log(url);
        fetch(url)        
            .then(response => response.json())
            .then(data => {
                setUsers(data);
                setEditItems({});
            })
            .catch(console.error);
    }

    useEffect(() => {
        fetchUsers();
    }, [filters]);    
      
      const handleUpdate = async (user) => {
        try {
          await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
          });

          setEditItems((prev) => ({
            ...prev, [user.id]:false
        })) 

        fetchUsers();

        } catch (err) {
          console.error(err);
        }
      };
      
      const handleDelete = async (id) => {
        try {
          await fetch(`/api/users`, { method: 'DELETE' });
        } catch (err) {
          console.error(err);
        }
      };

      const handleFieldChange = (id, field, value) => {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id ? { ...user, [field]: value } : user
          )
        );
      };

      
    
    return (
        <div className="w-screen min-h-screen bg-white font-black flex flex-col justify-start gap-10 items-center pb-2.5 text-gray-800">
            <div className='text-center text-white bg-[#b20303] text-5xl flex flex-row justify-center items-center w-full h-auto p-3.5'>
                Users
            </div>
            
            <div className='bg-transparent rounded-2xl font-extralight flex flex-col md:flex-row justify-around items-center w-full md:w-[90%] p-4 gap-4'>
                <div className='text-black text-2xl'>Filter:</div>
                <input 
                    className='w-full bg-white text-black p-2 rounded-xl border-1'
                    placeholder='Employee ID'
                    value={employeeId || ""}
                    onChange={(e) => setEmployeeId(e.target.value)}
                />
                <div className='w-full flex gap-2'>
                    <select 
                        className=' w-full bg-white text-black p-2 rounded-xl border-1'
                        value={role || ""}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="ADMIN">Admin</option>
                        <option value="EMPLOYEE">Employee</option>
                    </select>
                    <input 
                        type='text'
                        className='w-full bg-white text-black p-2 rounded-xl border-1'
                        value={workLocationsParam || ""}
                        onChange={(e) => setWorkLocationsParam(e.target.value)}
                    />
                </div>
                <button 
                    className='bg-blue-500 text-white p-2 rounded-xl min-w-[150px]'
                    onClick={() => {
                        setFilters({
                            employeeId,
                            role,
                            workLocationsParam,
                        });
                    }}
                >
                    Apply Filters
                </button>
            </div>


            {/* Requests Table */}
            <div className='text-gray-800 text-sm max-h-[600px] bg-transparent overflow-scroll flex flex-col  w-[98%] md:w-[90%]'>
                <div className="min-w-[1500px] h-auto flex flex-col">
                        {/* Table Header */}
                        <div className="bg-[#0377e2] flex flex-row justify-around items-center p-2.5 text-white text-center">
                            <div className="p-3 w-[10%]">Employee Number</div>
                            <div className="p-3 w-[20%]">Name</div>
                            <div className="p-3 w-[15%]">Email</div>
                            <div className="p-3 w-[10%]">Role</div>
                            <div className="p-3 w-[15%]">Work Locations</div>
                            <div className="p-3 w-[10%]">Joined At</div>
                            <div className="p-3 w-[10%]">Last Changed</div>
                            <div className="p-3 w-[10%]">Actions</div>
                        </div>

                        {/* Table Rows */}
                        {users.map((user, index) => (
                        <div
                            key={user.id}
                            className="flex flex-row items-center justify-around w-full text-center"
                            style={{ backgroundColor: index % 2 ? '#fff' : '#dadada' }}
                        >
                            <div className="p-3 w-[10%]">{user.employeeNumber}</div>
                            <div className="p-3 w-[20%]">{user.name}</div>
                            <div className="p-3 w-[15%]">{user.email}</div>
                            <div className="p-3 w-[10%]">
                                {
                                    isAdmin ? 
                                    (<select 
                                        className=' bg-white p-2 rounded-xl border-1 border-gray-300'
                                        value={user.role}
                                        onChange={(e) => {
                                            handleFieldChange(user.id, 'role', e.target.value);
                                            setEditItems((prev) => ({
                                                ...prev, [user.id]:true
                                            }))
                                        }}
                                    >
                                        <option value="ADMIN">admin</option>
                                        <option value="EMPLOYEE">employee</option>
                                    </select>)
                                    :
                                    user.role
                                }
                            </div>
                            <div className="p-3 w-[15%]">
                            {
                                isAdmin ? (<input
                                    type="text"
                                    value={user.workLocationId}
                                    onChange={(e) => {
                                        let inputText = e.target.value
                                        handleFieldChange(user.id, 'workLocationId', inputText.split(',').map(Number));
                                        setEditItems((prev) => ({
                                            ...prev, [user.id]:true
                                        }))                                
                                    }}
                                    className="w-3/4 p-2 bg-white border-1 border-gray-300 rounded-xl"
                                />) : user.workLocationId
                            }
                            </div>
                            <div className="p-3 w-[10%]">{user.createdAt}</div>
                            <div className="p-3 w-[10%]">{user.updatedAt}</div>
                            <div className="p-3 w-[10%] flex flex-col">
                            {
                                isAdmin ? (
                                    <>
                                        <button 
                                        style={{backgroundColor: editItems[user.id] ? "#0377e2" : "#dadada"}}
                                        onClick={() => handleUpdate(user)} className="mb-1 bg-blue-500 text-white px-2 py-1">Update</button>
                                        <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white px-2 py-1">Delete</button>
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

export default Users