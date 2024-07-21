import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { backendServer } from '../utils/info';
import CircularProgress from '@mui/material/CircularProgress';
import toast from 'react-hot-toast';
import { IoArrowBack } from 'react-icons/io5';
import Comments from '../components/Comments';
import ProjectItem from '../components/ProjectItem';
import { IoMdAdd } from 'react-icons/io';
import { Dialog } from '@material-tailwind/react';

const Project = () => {
    const address = useParams();
    const navigate = useNavigate();

    const [projectDetails, setProjectDetails] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '', desc: '', client: '', budget: 0
    });
    const [section, setSection] = useState({
        projectId: address.id, secname: ''
    });
    const [clients, setClients] = useState([]);
    const [sections, setSections] = useState([]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState(null);

    const handleOpen = (projectId) => {
        setActiveProjectId(projectId);
        setDialogOpen(true);
    };

    const handleClose = () => {
        setActiveProjectId(null);
        setDialogOpen(false);
    };

    const [openForm, setOpenForm] = useState(false);

    const handleOpenForm = () => {
        setOpenForm(state => !state);
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
        setSection(prevSection => ({
            ...prevSection,
            [name]: value
        }));
    };

    const fetchDetails = async () => {
        try {
            const response = await axios.get(`${backendServer}/api/project/${address.id}`);
            const project = response.data;
            setProjectDetails(project);
            setFormData({
                name: project.name, desc: project.desc, client: project.client, budget: project.budget
            });
            setLoading(false);
        } catch (error) {
            setError(error.message);
            setLoading(false);
        }
    }

    const fetchClientsNames = async () => {
        try {
            const response = await axios.get(`${backendServer}/api/getclientnames`);
            setClients(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await axios.get(`${backendServer}/api/getsections/${address.id}`);
            setSections(response.data.sectionData);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDetails();
        fetchClientsNames();
        fetchSections();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${backendServer}/api/project/${address.id}`, formData);
            toast.success(response.data.message);
            fetchDetails();
            setLoading(false);
        } catch (err) {
            toast.error(err.message);
            setError(err.message);
            setLoading(false);
        }
    }

    const addSection = async (e) => {
        e.preventDefault();
        if (section.secname.length === 0) {
            toast.error("Fill the mandatory field!");
            setOpenForm(false);
        } else {
            try {
                const response = await axios.post(`${backendServer}/api/addSection`, section);
                setSection({ projectId: address.id, secname: '' });
                toast.success(response.data.message);
                setOpenForm(false);
                fetchSections();
            } catch (error) {
                toast.error(error.response.data.message);
                setOpenForm(false);
            }
        }
    }

    if (loading) return (
        <div className='w-full flex items-center justify-center p-4'>
            <CircularProgress />
        </div>
    );

    if (error) return (
        <div className="w-full flex items-center justify-center text-red-600 font-medium p-4">
            Error: {error}
        </div>
    );

    return (
        <div className="w-full flex items-center justify-center">
            <div className="w-full min-h-screen flex flex-col items-center justify-start border-[0.75rem] border-solid border-[#DCD8FF] rounded-lg bg-[#F8F9FD]">
                <div className="w-full flex items-center justify-start p-6 bg-[#F8F9FD] gap-6">
                    <div onClick={() => navigate(-1)}
                        className="flex items-center justify-center rounded-[50%] bg-[#7F55DE] p-2 cursor-pointer">
                        <IoArrowBack className='text-white text-2xl' />
                    </div>
                    <img className={`w-[6rem]`} src="../images/logoBlue.png" alt="Logo" />
                </div>

                <div className="w-full flex items-start justify-center bg-[#F8F9FD] gap-4 px-4 pb-4">
                    <div className="w-full flex items-center justify-center bg-white">
                        <div className="w-full flex flex-col items-center justify-start p-4 gap-3">
                            <div className="w-full flex items-center justify-start text-gray-900 text-2xl font-medium">Project Details</div>
                            <div className="w-full h-[2px] bg-gray-300"></div>
                            <form onSubmit={handleSubmit} className="w-full flex flex-col items-start justify-start gap-2.5">
                                <div className="w-full max-w-[60%] flex items-center justify-start gap-2">
                                    <label className='text-nowrap' htmlFor="name">Project Name:</label>
                                    <input value={formData.name} onChange={handleInputChange}
                                        className='w-full focus:border-b border-solid border-b-black p-1 bg-transparent outline-none'
                                        type="text" name="name" />
                                </div>
                                <div className="w-full max-w-[60%] flex items-center justify-start gap-2">
                                    <label className='text-nowrap' htmlFor="desc">Project Description:</label>
                                    <input value={formData.desc} onChange={handleInputChange}
                                        className='w-full focus:border-b border-solid border-b-black p-1 bg-transparent outline-none'
                                        type="text" name="desc" />
                                </div>
                                <div className="w-full max-w-[60%] flex items-center justify-start gap-2">
                                    <label className='text-nowrap' htmlFor="client">Client:</label>
                                    <select
                                        value={formData.client}
                                        onChange={handleInputChange}
                                        className='p-1 outline-none' name="client" id="client">
                                        {clients.map((client) => (
                                            <option key={client.id} value={client.name}>{client.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full max-w-[60%] flex items-center justify-start gap-2">
                                    <div>Status:</div>
                                    {
                                        projectDetails.progress === "Not Started" ?
                                            <div className='p-1 px-3 bg-blue-gray-50 text-gray-700 rounded-3xl font-medium'>{projectDetails.progress}</div> :
                                            projectDetails.progress === "In progress" ?
                                                <div className='p-1 px-3 bg-orange-50 text-orange-700 rounded-3xl font-medium'>{projectDetails.progress}</div> :
                                                projectDetails.progress === "Request for Approval" ?
                                                    <div className='p-1 px-3 bg-blue-50 text-blue-700 rounded-3xl font-medium'>{projectDetails.progress}</div> :
                                                    projectDetails.progress === "Approved" ?
                                                        <div className='p-1 px-3 bg-green-50 text-green-700 rounded-3xl font-medium'>{projectDetails.progress}</div> :
                                                        projectDetails.progress === "Rejected" ?
                                                            <div className='p-1 px-3 bg-red-50 text-red-700 rounded-3xl font-medium'>{projectDetails.progress}</div> : ""
                                    }
                                </div>
                                <div className="w-full max-w-[60%] flex items-center justify-start gap-2">
                                    <label className='text-nowrap' htmlFor="budget">Budget ($):</label>
                                    <input value={formData.budget} onChange={handleInputChange}
                                        className='w-full focus:border-b border-solid border-b-black p-1 bg-transparent outline-none'
                                        type="number" name="budget" />
                                </div>
                                <div className="w-full flex items-center justify-end">
                                    <button onClick={handleSubmit}
                                        type="button" className='w-fit bg-[#7F55DE] p-2 px-3 text-white text-base font-medium rounded-lg'>
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    <div className="w-full flex items-center justify-center bg-white">
                        <Comments id={address.id} />
                    </div>
                </div>

                <div className="w-full flex items-center justify-center bg-[#F8F9FD] px-4 pb-4">
                    <div className="w-full flex flex-col items-center justify-start gap-3 p-4 bg-white">
                        <div className="w-full flex items-center justify-start text-gray-900 text-2xl font-medium">
                            Project Sections
                        </div>
                        <div className="w-full h-[2px] bg-gray-300"></div>
                        <div className="w-full flex items-center justify-start">
                            <button onClick={handleOpenForm}
                                type="button" className='w-fit bg-[#7F55DE] p-2 px-3 text-white text-base font-medium rounded-lg flex items-center justify-center gap-2'>
                                <IoMdAdd className='text-xl' />
                                <div className='text-nowrap'>Add Section</div>
                            </button>
                            <Dialog
                                size="sm"
                                open={openForm}
                                handler={handleOpenForm}
                                className="bg-transparent shadow-none w-full flex items-center justify-center"
                            >
                                <form onSubmit={addSection} className='w-full flex items-center justify-center bg-white p-4 rounded-lg text-black'>
                                    <div className="w-full flex items-center justify-between">
                                        <div className="flex items-center justify-center gap-2">
                                            <label htmlFor="secname" className='font-medium'>Section:</label>
                                            <sup className='-ml-2 mt-2 text-lg text-red-600 font-medium'>*</sup>
                                            <input value={section.secname} onChange={handleInputChange}
                                                className='outline-none p-1 border-b border-solid border-black' type="text" name="secname" />
                                        </div>
                                        <button type='submit' className='w-fit bg-[#7F55DE] p-2 px-3 text-white text-base font-medium rounded-lg'>Add</button>
                                    </div>
                                </form>
                            </Dialog>
                        </div>
                        <div className="w-full flex flex-col items-center">
                            {
                                sections.length == 0 ? <div className="w-full items-center justify-start font-medium py-2">Add new section to begin.</div> :
                                    sections.map(section => (
                                        <ProjectItem
                                            key={section._id}
                                            name={section.secname}
                                            id={section._id}
                                            isOpen={dialogOpen && activeProjectId === section._id}
                                            handleOpen={() => handleOpen(section._id)}
                                            handleClose={handleClose}
                                            addressID={address.id}
                                            fetchSections={fetchSections}
                                        />
                                    ))
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Project;
