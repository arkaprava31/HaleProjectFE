import { useContext, useEffect, useState } from "react";
import { format, addDays, subDays, isFuture, startOfWeek } from "date-fns";
import { TiDeleteOutline } from "react-icons/ti";
import { GrLinkPrevious, GrLinkNext } from "react-icons/gr";
import axios from "axios";
import { backendServer } from "../../utils/info";
import CircularProgress from "@mui/material/CircularProgress";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../../context/CommonContext";
import toast from "react-hot-toast";

const TimeCalendar = () => {
	const navigate = useNavigate();
	const { handleMenuID } = useContext(AppContext);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [saveLoader, setSaveLoader] = useState(false);
	const [comment, setComment] = useState("");

	const userId = localStorage.getItem("userId");
	const loggedInUser = localStorage.getItem("name");
	const token = localStorage.getItem("token");

	const getDaysRange = (currentDate) => {
		const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 });
		const daysRange = [];
		for (let i = 0; i < 7; i++) {
			daysRange.push(addDays(startOfWeekDate, i));
		}
		return daysRange;
	};

	const [projectData, setProjectData] = useState([]); // Project list from backend
	const [currentDate, setCurrentDate] = useState(new Date());
	const [hours, setHours] = useState(Array(4).fill({ name: "", hours: {} })); // 4 rows for projects

	const daysRange = getDaysRange(currentDate, 7); // 15-day range

	// Fetch the list of projects (e.g., sales data)
	const fetchSalesData = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`${backendServer}/api/sales`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			// console.log("salesData", response.data.salesData);

			setProjectData(
				response.data.salesData.filter((sale) =>
					sale.invitedUsers.includes(loggedInUser)
				)
			);
			setLoading(false);
		} catch (error) {
			setError(error.message);
		}
	};

	// Fetch the existing time entries for the user and selected project

	const [teDocsLen, setTEDocsLen] = useState(0);

	const fetchTEDocs = async () => {
		setLoading(true);
		try {
			const response = await axios.get(`${backendServer}/api/te-docs`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setTEDocsLen(response.data.length);
			setLoading(false);
		} catch (error) {
			setError(error.response.data.message);
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchSalesData();
		// fetchTimeData();
		fetchTEDocs();
	}, []);

	// Handle changing work hours for each project on each date
	const handleHourChange = (rowIndex, day, value) => {
		const updatedHours = [...hours];

		if (updatedHours[rowIndex].name !== "") {
			updatedHours[rowIndex].hours[day] = value;
		} else {
			toast.error("Select project to input hour details!");
		}
		setHours(updatedHours);
	};

	// Handle selecting a project from the dropdown
	const handleSelectProject = (rowIndex, projectName) => {
		const updatedHours = [...hours];
		updatedHours[rowIndex] = { name: projectName, hours: {} };
		setHours(updatedHours);
	};

	const isProjectSelected = (projectName) => {
		return hours.some((row) => row.name === projectName);
	};

	// Handle removing a project
	const handleRemoveProject = (rowIndex) => {
		const updatedHours = [...hours];
		updatedHours[rowIndex] = { name: "", hours: {} };
		setHours(updatedHours);
	};

	// Move to the next or previous 15-day range
	const nextDays = () => setCurrentDate(addDays(currentDate, 7));
	const previousDays = () => setCurrentDate(subDays(currentDate, 7));
	function isWeekend(date) {
		const day = new Date(date).getDay();
		// 0 is Sunday, 6 is Saturday
		return day === 0 || day === 6;
	}

	// Handle setting currentDate to today
	const handleToday = () => setCurrentDate(new Date());
	// Function to check if a given date is today
	const isToday = (date) => {
		const today = new Date();
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	};

	// Handle selecting a week starting with a specific date from the calendar
	const handleDateChange = (e) => {
		const selectedDate = new Date(e.target.value);
		const weekStartDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
		setCurrentDate(weekStartDate);
	};

	// Calculate total hours per row
	const calculateTotalHours = (row) => {
		return Object.values(row.hours).reduce(
			(total, value) => total + (parseFloat(value) || 0),
			0
		);
	};

	// Calculate total hours per column (per day)
	const calculateDailyTotal = (day) => {
		return hours.reduce(
			(total, row) => total + (parseFloat(row.hours[day]) || 0),
			0
		);
	};

	// Calculate work schedule (static 8 hours per day for now)
	const calculateWorkSchedule = () => 8;

	// Calculate daily overtime (hours beyond 8)
	const calculateDailyOvertime = (day) => {
		const totalHours = calculateDailyTotal(day);
		return totalHours > 8 ? totalHours - 8 : 0;
	};

	// Handle save functionality
	const handleSave = async () => {
		setSaveLoader(true);

		try {
			const allProjectsForDays = [];

			// Iterate over the days and accumulate all project data
			for (let day of daysRange) {
				// Filter out projects where there are no hours for the specific day
				const projectsForDay = hours
					.filter((row) => row.name) // Only save rows with project names
					.map((row) => {
						const project = projectData.find((p) => p.name === row.name);
						const hoursForDay = row.hours[day]; // Get hours for the specific day

						if (hoursForDay && parseFloat(hoursForDay) > 0) {
							// Only include if hours exist and are greater than 0
							return {
								projectCode: project.code, // Ensure the project projectCode is sent
								hours: parseFloat(hoursForDay), // Parse the hours to a float value
							};
						}
						return null;
					})
					.filter(Boolean); // Remove null values from the array

				// Only include the day if there are projects with hours for the day
				if (projectsForDay.length > 0) {
					allProjectsForDays.push({
						date: format(day, "yyyy-MM-dd"), // Format date as string
						projects: projectsForDay, // Projects for this specific day
					});
				}
			}

			// Send all accumulated project data in a single request
			if (allProjectsForDays.length > 0) {
				const payload = {
					timeEntries: allProjectsForDays, // All the time entries for each day
					comment,
					docid: `TE-00${teDocsLen + 1}`,
					user: loggedInUser,
				};

				// console.log(payload); // Log the final payload

				// Send the payload once
				await axios.post(`${backendServer}/api/times/${userId}`, {
					payload: payload,
				});

				setSaveLoader(false);
				toast.success("Hours saved successfully");
				navigate("/admin-panel");
				handleMenuID(10);
			} else {
				setSaveLoader(false);
				toast.error("No data to save");
			}
		} catch (error) {
			setSaveLoader(false);
			setError(error.message);
			toast.error("Failed to save hours");
		}
	};

	// Handle cancel action
	const handleCancel = () => {
		navigate("/admin-panel");
		handleMenuID(10);
	};

	return (
		<div className="overflow-x-auto p-4 text-sm w-full flx flex-col items-center justify-start">
			<div
				className="w-full flex items-center justify-between px-4 pb-4 mb-6"
				style={{ boxShadow: "0px 6px 4px -3px rgba(201,195,201,1)" }}
			>
				<div className="text-gray-900 text-2xl font-medium">Time</div>
				<div className="flex items-center justify-center gap-4 text-base">
					<button
						onClick={handleCancel}
						className="bg-gray-200 hover:bg-gray-300 py-1.5 px-4 cursor-pointer"
					>
						Cancel
					</button>
					{saveLoader ? (
						<div className="flex items-center justify-center px-4">
							<CircularProgress />
						</div>
					) : (
						<button
							onClick={handleSave}
							className={`bg-[#7F55DE] py-1.5 px-5 text-white ${
								loading || error ? "cursor-not-allowed" : "cursor-pointer"
							}`}
						>
							Save
						</button>
					)}
				</div>
			</div>

			{loading ? (
				<div className="w-full flex items-center justify-center mt-16">
					<CircularProgress />
				</div>
			) : (
				<div className="w-full flex flex-col items-center justify-start">
					{/* Navigation */}
					<div className="w-full flex items-center justify-between mb-4">
						<span className="text-base font-bold text-center w-full">
							{format(daysRange[0], "MMM dd")} -{" "}
							{format(daysRange[daysRange.length - 1], "MMM dd")}
						</span>
						<div className="flex items-center justify-between gap-3 text-lg">
							<input
								type="date"
								className="p-0.5 rounded border border-solid text-center text-base border-gray-400 pr-2 mr-2"
								onChange={handleDateChange}
							/>
							<GrLinkPrevious
								className="cursor-pointer text-[#7F55DE]"
								onClick={previousDays}
							/>
							<button
								className="hover:bg-gray-100 text-[#7F55DE] rounded text-sm px-2.5 py-1.5 border border-solid border-[#7F55DE]"
								onClick={handleToday}
							>
								Today
							</button>
							<GrLinkNext
								className="cursor-pointer text-[#7F55DE]"
								onClick={nextDays}
							/>
						</div>
					</div>

					{/* Calendar Table */}
					<div className="w-full overflow-x-auto">
						<table className="w-full table-auto border-collapse">
							<thead>
								<tr>
									<th className="px-4 py-2 w-48">Project</th>
									{daysRange.map((day, index) => (
										<th
											key={index}
											className={`px-4 py-2 text-nowrap ${
												isToday(day) ? "text-[#7F55DE]" : ""
											}`}
										>
											{format(day, "eee dd")}
										</th>
									))}
									<th className="px-4 py-2">Total</th>
								</tr>
							</thead>
							<tbody>
								{/* Render fixed rows for projects */}
								{hours.map((row, rowIndex) => (
									<tr key={rowIndex} className="border-t border-gray-400 ">
										{/* Project name dropdown */}
										<td className="px-4 py-2">
											{row.name ? (
												<div className="flex items-center gap-2">
													<span className="w-full">{row.name}</span>
													<TiDeleteOutline
														className="cursor-pointer text-red-500 text-xl font-bold"
														onClick={() => handleRemoveProject(rowIndex)}
													/>
												</div>
											) : (
												<select
													className="w-full px-2 py-1 border border-gray-300 outline-none"
													onChange={(e) =>
														handleSelectProject(rowIndex, e.target.value)
													}
												>
													<option value="" className="text-center"></option>
													{projectData.map((project) => (
														<option
															key={project._id}
															value={project.name}
															disabled={
																isProjectSelected(project.name) &&
																hours[rowIndex].name !== project.name
															}
															className="p-2"
														>
															{project.code}-{project.name}
														</option>
													))}
												</select>
											)}
										</td>

										{/* Render each day's input for hours */}
										{daysRange.map((day, dayIndex) => (
											<td
												key={dayIndex}
												className={`px-2 py-2 w-[3rem] ${
													isWeekend(day) ? "bg-gray-50" : ""
												}`}
											>
												<input
													type="number"
													value={row.hours[day] || ""}
													onChange={(e) =>
														handleHourChange(rowIndex, day, e.target.value)
													}
													className={`w-[2.5rem] px-2 py-1 border rounded  ${
														isWeekend(day) ? "bg-gray-100" : ""
													} `}
												/>
											</td>
										))}

										{/* Display total hours for the row */}
										<td className="px-4 py-2 w-24">
											{calculateTotalHours(row)}
										</td>
									</tr>
								))}

								{/* Totals, Work Schedule, and Overtime rows */}
								<tr className="border-t border-gray-400">
									<td className="px-4 py-2 font-bold">Total Hours</td>
									{daysRange.map((day, index) => (
										<td
											key={index}
											className={`px-4 py-2 font-bold ${
												isWeekend(day) ? "bg-gray-100" : ""
											}`}
										>
											{calculateDailyTotal(day)}
										</td>
									))}
									<td></td>
								</tr>

								<tr>
									<td className="px-4 py-2 font-bold">Work Schedule</td>
									{daysRange.map((day, index) => (
										<td
											key={index}
											className={`px-4 py-2 font-bold ${
												isWeekend(day) ? "bg-gray-100" : ""
											}`}
										>
											{calculateWorkSchedule()}
										</td>
									))}
									<td></td>
								</tr>

								<tr>
									<td className="px-4 py-2 font-bold">Overtime</td>
									{daysRange.map((day, index) => (
										<td
											key={index}
											className={`px-4 py-2 font-bold ${
												isWeekend(day) ? "bg-gray-100" : ""
											}`}
										>
											{calculateDailyOvertime(day)}
										</td>
									))}
									<td></td>
								</tr>
							</tbody>
						</table>
					</div>

					<div className="w-full mt-6">
						<h2 className="font-bold">Comment</h2>
						<textarea
							className="w-full p-2 border rounded-md"
							rows={4}
							value={comment}
							onChange={(e) => setComment(e.target.value)}
						/>
					</div>
				</div>
			)}

			{error && (
				<div className="text-red-500 text-center mt-4">
					{error} (Check console for details)
				</div>
			)}
		</div>
	);
};

export default TimeCalendar;
