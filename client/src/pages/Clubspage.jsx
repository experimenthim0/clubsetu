import React from "react";

// 🔹 Your Cleaned Club Data
export const clubsData = [
  {
    id: 1,
    club_name: "SPICE Society",
    category: "Technical",
    description:
      "Society for Progression of Instrumentation and Control Engineering. Organizes workshops, expert lectures and industrial tours.",
    faculty_coordinators: ["Dr. Afzal Sikander"],
    student_coordinators: ["Arpit Jha"],
    contacts: ["9636880077"],
  },
  {
    id: 2,
    club_name: "NETRA Photography Club",
    category: "Creative",
    description:
      "Photography club focusing on exhibitions, photowalks and competitions.",
    faculty_coordinators: ["Dr. Abhinav Pratap Singh"],
    student_coordinators: ["Priyanshu Sahu", "Rahul Kumar"],
    contacts: ["9919525922", "7707967639"],
  },
  {
    id: 3,
    club_name: "Kalakaar",
    category: "Cultural",
    description:
      "Official dramatics club encouraging acting, music, writing and stage performances.",
    faculty_coordinators: ["Dr. Sumer Singh Meena"],
    student_coordinators: ["Malhar Kawatra", "Nidhi Khunteta"],
    contacts: ["8239937689", "7300208494"],
  },
  {
    id: 4,
    club_name: "Fine Arts Society",
    category: "Creative",
    description:
      "Promotes visual and graphic arts through competitions and workshops.",
    faculty_coordinators: ["Dr. Sadhika Khullar"],
    student_coordinators: ["Rahul Kumar", "Komal"],
    contacts: ["9931287524", "9915264496"],
  },
  {
    id: 5,
    club_name: "Zeal Society",
    category: "Development",
    description:
      "Focuses on communication, leadership and event management skills.",
    faculty_coordinators: ["Dr. Jagwinder Singh", "Dr. Shyamkiran Kaur"],
    student_coordinators: ["Chetan Jassal", "Shuchi Gupta"],
    contacts: ["9056373107"],
  },
  {
    id: 6,
    club_name: "Rural Activity Club",
    category: "Social",
    description:
      "Organizes rural awareness programs, technology guidance and education outreach.",
    faculty_coordinators: ["Dr. Ashok Kumar Bagha"],
    student_coordinators: ["Shivam Saini"],
    contacts: ["8264792688"],
  },
  {
    id: 7,
    club_name: "Google Developer Student Club (GDSC)",
    category: "Technical",
    description:
      "Empowers students with Google technologies and real-world project collaboration.",
    faculty_coordinators: ["Dr. Indu Saini"],
    student_coordinators: ["Naman Singla", "Namamish Awasthi"],
    contacts: ["9464139983", "8787226741"],
    socials: {
      instagram: "#",
      twitter: "#",
      linkedin: "#",
      website: "#",
      whatsapp: "#",
    },
  },
];

const ClubsPage = ({ isHome = false }) => {
  // If isHome, show only first 3 clubs
  const clubsToShow = isHome ? clubsData.slice(0, 3) : clubsData;

  return (
    <div className={`${isHome ? "" : "min-h-screen bg-gray-50 py-12"} px-6`}>
      {/* Page Header - Hide if on Home */}
      {!isHome && (
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-black uppercase tracking-tight">
            NITJ Clubs & Societies
          </h1>
          <p className="mt-4 text-neutral-500 uppercase tracking-widest text-xs font-bold">
            Explore student clubs, connect with coordinators, and join
            activities.
          </p>
        </div>
      )}

      {/* Clubs Grid */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clubsToShow.map((club) => (
          <div
            key={club.id}
            className="bg-white border-2 border-black rounded-sm shadow-[8px_8px_0px_#000] p-6 flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_#000] transition-all"
          >
            <div>
              <span className="inline-block mb-3 px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 border border-orange-200 rounded-sm">
                {club.category}
              </span>

              <h2 className="text-2xl font-black text-black leading-tight">
                {club.club_name}
              </h2>

              <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                {club.description}
              </p>

              <div className="mt-6 text-[12px] text-neutral-500 space-y-2">
                <p className="flex items-center gap-2">
                  <i className="ri-user-star-line text-black" />
                  <span className="font-bold text-black uppercase tracking-tighter">
                    Faculty:
                  </span>{" "}
                  {club.faculty_coordinators.join(", ")}
                </p>
                <p className="flex items-center gap-2">
                  <i className="ri-group-line text-black" />
                  <span className="font-bold text-black uppercase tracking-tighter">
                    Students:
                  </span>{" "}
                  {club.student_coordinators.join(", ")}
                </p>
                <p className="flex items-center gap-2">
                  <i className="ri-phone-line text-black" />
                  <span className="font-bold text-black uppercase tracking-tighter">
                    Contact:
                  </span>{" "}
                  {club.contacts.join(", ")}
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-8 pt-6 border-t-2 border-neutral-100 flex items-center justify-center gap-4">
              <a
                href={club.socials?.instagram || "#"}
                className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-sm hover:bg-orange-600 hover:text-white transition-colors"
              >
                <i className="ri-instagram-line text-xl" />
              </a>
              <a
                href={club.socials?.twitter || "#"}
                className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-sm hover:bg-orange-600 hover:text-white transition-colors"
              >
                <i className="ri-twitter-x-line text-xl" />
              </a>
              <a
                href={club.socials?.linkedin || "#"}
                className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-sm hover:bg-orange-600 hover:text-white transition-colors"
              >
                <i className="ri-linkedin-box-line text-xl" />
              </a>
              <a
                href={club.socials?.website || "#"}
                className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-sm hover:bg-orange-600 hover:text-white transition-colors"
              >
                <i className="ri-global-line text-xl" />
              </a>
              <a
                href={club.socials?.whatsapp || "#"}
                className="w-10 h-10 flex items-center justify-center border-2 border-black rounded-sm hover:bg-orange-600 hover:text-white transition-colors"
              >
                <i className="ri-whatsapp-line text-xl" />
              </a>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center mt-8 text-neutral-500 uppercase tracking-widest text-xs font-bold">If you want to add your club or society, Click <a href="https://forms.gle/ZJKNhGXNrSkimWtG9" className="text-orange-600">here</a>.</p>
    </div>
  );
};

export default ClubsPage;