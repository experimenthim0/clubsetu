import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

const slugifyClubName = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const EditClub = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [clubId, setClubId] = useState(id);
  const [clubSlug, setClubSlug] = useState("");
  const [formData, setFormData] = useState({
    clubName: "",
    category: "",
    clubGallery: "",
    clubSponsors: "",
    description: "",
    clubLogo: "",
    studentCoordinators: "",
    clubInstagram: "",
    clubLinkedin: "",
    clubX: "",
    clubWebsite: "",
    clubWhatsapp: "",
    clubEmail: "",
    facultyEmail: "",
    facultyName: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    bankPhone: "",
  });

  useEffect(() => {
    const applyClubData = (club) => {
      setClubId(club._id || club.id);
      setClubSlug(club.slug || "");
      setFormData({
        clubName: club.clubName || "",
        category: club.category || "",
        description: club.description || "",
        clubLogo: club.clubLogo || "",
        studentCoordinators: club.studentCoordinators?.join(", ") || "",
        clubGallery: club.clubGallery?.join(", ") || "",
        clubSponsors: club.clubSponsors?.join(", ") || "",
        clubInstagram:
          club.socialLinks?.find((l) => l.platform === "instagram")?.url || "",
        clubLinkedin:
          club.socialLinks?.find((l) => l.platform === "linkedin")?.url || "",
        clubX: club.socialLinks?.find((l) => l.platform === "x")?.url || "",
        clubWebsite:
          club.socialLinks?.find((l) => l.platform === "website")?.url || "",
        clubWhatsapp:
          club.socialLinks?.find((l) => l.platform === "whatsapp")?.url || "",
        clubEmail: club.clubEmail || "",
        facultyEmail: club.facultyEmail || club.facultyCoordinator?.email || "",
        facultyName: club.facultyName || club.facultyCoordinator?.name || "",
        bankName: club.bankName || "",
        accountHolderName: club.accountHolderName || "",
        accountNumber: club.accountNumber || "",
        ifscCode: club.ifscCode || "",
        upiId: club.upiId || "",
        bankPhone: club.bankPhone || "",
      });
    };

    const fetchClub = async () => {
      try {
        // If id is 'id' or undefined, try to get from logged in user
        let targetId = id === "id" ? null : id;
        if (!targetId) {
          const storedUserData = localStorage.getItem("user");
          const storedUser =
            storedUserData && storedUserData !== "undefined"
              ? JSON.parse(storedUserData)
              : null;
          targetId = storedUser?.clubId;

          // Fallback: look for CLUB_HEAD role in memberships
          if (!targetId && storedUser?.memberships?.length > 0) {
            const headMembership = storedUser.memberships.find(
              (m) => m.role === "CLUB_HEAD",
            );
            targetId =
              headMembership?.clubId || storedUser.memberships[0].clubId;
          }
        }

        if (!targetId) {
          throw new Error("No club ID found.");
        }

        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/clubs/${targetId}`,
        );
        if (!res.data.club) {
          throw new Error("Club data not found in response.");
        }
        applyClubData(res.data.club);
      } catch (err) {
        console.error("DEBUG: fetchClub error:", err);
        if (
          err.response?.status === 404 ||
          err.message === "No club ID found."
        ) {
          try {
            const storedUserData = localStorage.getItem("user");
            const storedUser =
              storedUserData && storedUserData !== "undefined"
                ? JSON.parse(storedUserData)
                : null;
            const storedRole = localStorage.getItem("role");

            if (
              storedUser &&
              (storedRole === "club" || storedRole === "facultyCoordinator")
            ) {
              const clubsRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/clubs`,
              );
              const matchedClub = clubsRes.data.find(
                (club) =>
                  club._id === storedUser.clubId ||
                  (club.clubName || "").trim().toLowerCase() ===
                    (storedUser.clubName || "").trim().toLowerCase(),
              );

              if (matchedClub) {
                applyClubData(matchedClub);
                return;
              }
            }
          } catch (fallbackErr) {
            console.error("Fallback club lookup failed:", fallbackErr);
          }
        }

        showNotification("Failed to fetch club data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [id, showNotification]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Pack social links into array for the backend
      const socialLinks = [
        { platform: "instagram", url: formData.clubInstagram },
        { platform: "linkedin", url: formData.clubLinkedin },
        { platform: "x", url: formData.clubX },
        { platform: "website", url: formData.clubWebsite },
        { platform: "whatsapp", url: formData.clubWhatsapp },
      ].filter((link) => link.url && link.url.trim() !== "");

      const processedData = {
        ...formData,
        socialLinks,
        clubGallery: formData.clubGallery
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        clubSponsors: formData.clubSponsors
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        studentCoordinators: formData.studentCoordinators
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s !== ""),
      };

      // Cleanup the flattened fields before sending
      delete processedData.clubInstagram;
      delete processedData.clubLinkedin;
      delete processedData.clubX;
      delete processedData.clubWebsite;
      delete processedData.clubWhatsapp;
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/clubs/${clubId}`,
        processedData,
      );

      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (storedUser) {
        const updatedUser = {
          ...storedUser,
          clubId: res.data.club._id,
          clubSlug: res.data.club.slug || "",
          clubName: res.data.club.clubName || storedUser.clubName,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      showNotification("Club information updated successfully", "success");
      navigate(`/club/${res.data.club.slug || clubSlug || clubId}`);
    } catch (err) {
      showNotification(err.response?.data?.message || "Update failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="flex justify-between items-center mb-6 md:mb-12">
        <h1 className="text-2xl md:text-4xl font-medium tracking-wide text-black">
          Edit Club Profile
        </h1>
        <button
          onClick={() => navigate(`/club/${clubSlug || clubId}`)}
          className="text-xs font-bold tracking-wide text-neutral-400 hover:text-black transition-colors"
        >
          Cancel
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border-2 border-gray-300 p-6 md:p-12 space-y-12 "
      >
        {/* Basic Info Section */}
        <div className="space-y-6">
          {/* <h3 className="font-medium tracking-wide text-xs border-b-2 border-neutral-120 pb-3 flex items-center gap-3">
                        <i className="ri-information-fill text-orange-600 text-lg" /> Core Identity
                    </h3> */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                Club Name
              </label>
              <input
                type="text"
                name="clubName"
                value={formData.clubName}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium transition-colors  rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Technical, Cultural, Sports..."
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium transition-colors rounded-sm"
              />
            </div>
            {/* <div>
                            <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">Club Contact Email</label>
                            <input 
                                type="email" 
                                name="clubEmail" 
                                value={formData.clubEmail} 
                                onChange={handleChange}
                                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-bold transition-colors rounded-sm"
                            />
                        </div> */}
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                Faculty Coordinator/s (Comma separated names)
              </label>
              <input
                type="text"
                name="facultyName"
                value={formData.facultyName}
                onChange={handleChange}
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium transition-colors rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                Student Coordinators (Comma separated names)
              </label>
              <input
                type="text"
                name="studentCoordinators"
                value={formData.studentCoordinators}
                onChange={handleChange}
                placeholder="Name 1, Name 2, Name 3"
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium transition-colors rounded-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
              Club Mission / Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium leading-relaxed transition-colors rounded-sm"
            ></textarea>
          </div>
        </div>

        {/* Visuals & Media */}
        <div className="space-y-6">
          <h3 className="font-medium tracking-wide text-xs border-b-2 border-neutral-120 pb-3 flex items-center gap-3">
            <i className="ri-image-fill text-orange-600 text-lg" /> Media &
            Visuals
          </h3>
          <div>
            <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
              Club Logo URL
            </label>
            <input
              type="url"
              name="clubLogo"
              value={formData.clubLogo}
              onChange={handleChange}
              placeholder="https://example.com/logo.png"
              className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-mono text-xs rounded-sm"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
              Gallery Images (Comma separated URLs)
            </label>
            <textarea
              name="clubGallery"
              value={formData.clubGallery}
              onChange={handleChange}
              placeholder="https://url1.jpg, https://url2.jpg..."
              rows="4"
              className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-mono text-xs rounded-sm"
            ></textarea>
          </div>
          <div>
            <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
              Club Sponsors (Comma separated URLs)
            </label>
            <textarea
              name="clubSponsors"
              value={formData.clubSponsors}
              onChange={handleChange}
              placeholder="https://sponsor1-logo.jpg, https://sponsor2-logo.jpg..."
              rows="4"
              className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-mono text-xs rounded-sm"
            ></textarea>
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-6">
          <h3 className="font-medium tracking-wide text-xs border-b-2 border-neutral-120 pb-3 flex items-center gap-3">
            <i className="ri-share-fill text-orange-600 text-lg" /> Public
            Presence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                Instagram URL
              </label>
              <input
                type="url"
                name="clubInstagram"
                value={formData.clubInstagram}
                onChange={handleChange}
                placeholder="https://instagram.com/club"
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium text-xs rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                name="clubLinkedin"
                value={formData.clubLinkedin}
                onChange={handleChange}
                placeholder="https://linkedin.com/company/club"
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium text-xs rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                X / Twitter URL
              </label>
              <input
                type="url"
                name="clubX"
                value={formData.clubX}
                onChange={handleChange}
                placeholder="https://x.com/club"
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium text-xs rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                Website URL
              </label>
              <input
                type="url"
                name="clubWebsite"
                value={formData.clubWebsite}
                onChange={handleChange}
                placeholder="https://club.com"
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium text-xs rounded-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium tracking-wide text-neutral-500 mb-2">
                WhatsApp Group/No.
              </label>
              <input
                type="text"
                name="clubWhatsapp"
                value={formData.clubWhatsapp}
                onChange={handleChange}
                placeholder="Contact number or group link"
                className="w-full p-3 border-2 border-gray-300 focus:bg-orange-50 outline-none font-medium text-xs rounded-sm"
              />
            </div>
          </div>
        </div>
        {/* Financial Information */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-end w-full">
              <button
                type="button"
                onClick={() => navigate(`/club/${clubSlug || clubId}`)}
                className="flex-1 py-3 border-2 border-gray-300 tracking-wide hover:bg-neutral-120 transition-colors font-medium rounded-sm hover:cursor-pointer"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 py-3 text-white font-medium tracking-wide transition-all rounded-sm active:translate-x-1 active:translate-y-1 active:shadow-none hover:cursor-pointer ${isSaving ? " bg-[#848b92] cursor-not-allowed shadow-none" : "bg-[#0f1419] hover:bg-[#0f1419]/70"}`}
              >
                {isSaving ? "Syncing..." : "Update Club"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default EditClub;
