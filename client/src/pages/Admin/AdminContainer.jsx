import { useState, useEffect, useContext } from 'react'
import AppWrapper from '@/components/AppWrapper.jsx'
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Switch } from '@mui/material';
import LoadingWrapper from "@/components/LoadingWrapper"
import UserContext from '@/context/UserContext.jsx'

const AdminContainer = () => {
    const [projectUsers, setProjectUsers] = useState([])
    const [projects, setProjects] = useState([])
    const [users, setUsers] = useState([])
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(null)
    const {user} = useContext(UserContext);

    if(user && !user.is_admin){
        return (
            <AppWrapper>
                <div className="container py-8">
                    <div className="text-red-500">Unauthorized: Admin access required</div>
                </div>
            </AppWrapper>
        )
    }
    
    useEffect(() => {
        fetchAllData()
    }, [])

    const fetchAllData = async () => {
        try {
            // Fetch all three endpoints
            const [projectUsersRes, projectsRes, usersRes] = await Promise.all([
                fetch('/api/projectusers'),
                fetch('/api/projects/minimal'),
                fetch('/api/users')
            ])

            if (!projectUsersRes.ok || !projectsRes.ok || !usersRes.ok) {
                toast.error("Failed to load data")
                setError("Failed to load data")
                return
            }

            const projectUsersData = await projectUsersRes.json()
            const projectsData = await projectsRes.json()
            const usersData = await usersRes.json()

            console.log("Project users:", projectUsersData)
            console.log("Projects:", projectsData)
            console.log("Users:", usersData)

            setProjectUsers(projectUsersData)
            setProjects(projectsData)
            setUsers(usersData)
            setLoaded(true)
        } catch (error) {
            console.error("Fetch error:", error)
            toast.error("Network error loading data")
            setError("Network error")
        }
    }
    console.log("Current project users state:", projectUsers)

    const handleAdminToggle = (userId, currentAdminStatus) => {
        const newAdminStatus = !currentAdminStatus
        console.log(`Toggling admin for user ${userId}: ${currentAdminStatus} -> ${newAdminStatus}`)
        
        fetch(`/api/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_admin: newAdminStatus })
        })
        .then(res => {
            if(res.ok){
                res.json()
                .then(data => {
                    console.log("Admin toggle response:", data)
                    // Update local state
                    setUsers(prev => prev.map(u => 
                        u.id === userId ? { ...u, is_admin: data.is_admin } : u
                    ))
                    toast.success(`Admin status ${newAdminStatus ? 'granted' : 'revoked'}`)
                })
            } else {
                toast.error("Failed to update admin status")
            }
        })
        .catch(error => {
            console.error("Admin toggle error:", error)
            toast.error("Network error updating admin status")
        })
    }

    const handleToggle = (userId, projectId, currentStatus) => {
        const projectUser = projectUsers.find(pu => 
            pu.user_id === userId && pu.project_id === projectId
        )

        if (projectUser) {
            // Update existing project user
            // currentStatus = hasAccess (true means has access, false means no access)
            // deleted is opposite of access, so when toggling from hasAccess=true, deleted should become true
            const newDeletedStatus = currentStatus
            console.log(`Toggling: currentStatus=${currentStatus}, newDeletedStatus=${newDeletedStatus}`)
            fetch(`/api/projectusers/${projectUser.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ deleted: newDeletedStatus })
            })
            .then(res => {
                if(res.ok){
                    res.json()
                    .then(data => {
                        console.log("PATCH response:", data)
                        // Update local state
                        setProjectUsers(prev => prev.map(pu => 
                            pu.id === projectUser.id ? data : pu
                        ))
                        toast.success(`Access ${newDeletedStatus ? 'revoked' : 'granted'}`)
                    })
                } else {
                    toast.error("Failed to update access")
                }
            })
            .catch(error => {
                console.error("Toggle error:", error)
                toast.error("Network error updating access")
            })
        } else {
            // Create new project user
            fetch('/api/projectusers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    user_id: userId, 
                    project_id: projectId,
                    deleted: false
                })
            })
            .then(res => {
                if(res.ok){
                    res.json()
                    .then(data => {
                        // Add to local state
                        setProjectUsers(prev => [...prev, data])
                        toast.success("Access granted")
                    })
                } else {
                    toast.error("Failed to create access")
                }
            })
            .catch(error => {
                toast.error("Network error creating access")
            })
        }
    }

    const hasAccess = (userId, projectId) => {
        // Check if user is admin
        const userObj = users.find(u => u.id === userId)
        if (userObj && userObj.is_admin) {
            return true // Admins always have access
        }
        
        const projectUser = projectUsers.find(pu => 
            pu.user_id === userId && pu.project_id === projectId
        )
        return projectUser ? !projectUser.deleted : false
    }

    if (!loaded) {
        return (
            <AppWrapper>
                <LoadingWrapper />
            </AppWrapper>
        )
    }

    if (error) {
        return (
            <AppWrapper>
                <div className="container py-8">
                    <div className="text-red-500">{error}</div>
                </div>
            </AppWrapper>
        )
    }

    return (
        <AppWrapper>
            <div className="container py-8 px-4">
                <h1 className="text-3xl font-bold mb-8">Project Access Administration</h1>
                
                <TableContainer component={Paper} className="shadow-lg">
                    <Table>
                        <TableHead>
                            <TableRow className="bg-gray-50">
                                <TableCell className="font-bold py-4 px-6">User</TableCell>
                                <TableCell className="font-bold text-center py-4 px-6">Admin</TableCell>
                                {projects.map(project => (
                                    <TableCell key={project.id} className="font-bold text-center py-4 px-6">
                                        {project.name}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id} className="hover:bg-gray-50">
                                    <TableCell className="py-4 px-6">
                                        <div>
                                            <div className="font-medium">{u.first_name} {u.last_name}</div>
                                            <div className="text-sm text-gray-500">{u.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center py-4 px-6">
                                        <Switch
                                            checked={u.is_admin || false}
                                            onChange={() => handleAdminToggle(u.id, u.is_admin)}
                                            color="primary"
                                        />
                                    </TableCell>
                                    {projects.map(project => (
                                        <TableCell key={`${u.id}-${project.id}`} className="text-center py-4 px-6">
                                            <Switch
                                                checked={hasAccess(u.id, project.id)}
                                                onChange={() => handleToggle(u.id, project.id, hasAccess(u.id, project.id))}
                                                disabled={u.is_admin}
                                                color="primary"
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </AppWrapper>
    )
}

export default AdminContainer
