import React from 'react';
import { Github, Linkedin, Twitter } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';

/**
 * @typedef {Object} TeamMember
 * @property {string} id - Unique identifier for the team member
 * @property {string} name - Full name of the team member
 * @property {string} role - Member's role or position within the team
 * @property {string} imageUrl - URL to the member's profile image
 * @property {Object} socials - Object containing social media links
 * @property {string} [socials.twitter] - Twitter/X profile link (optional)
 * @property {string} [socials.github] - GitHub profile link (optional)
 * @property {string} [socials.linkedin] - LinkedIn profile link (optional)
 */

/** @type {TeamMember[]} */
const TEAM_MEMBERS = [
  {
    id: '1',
    name: 'Himanshu Yadav',
    role: 'Founder & Lead Developer',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
  {
    id: '2',
    name: 'Meera Nair',
    role: 'Co-Founder & Product Designer',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
  {
    id: '3',
    name: 'Aarav Sharma',
    role: 'Frontend Architect',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
  {
    id: '4',
    name: 'Ananya Patel',
    role: 'Backend Lead',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: '5',
    name: 'Kabir Mehta',
    role: 'DevOps Specialist',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
  {
    id: '6',
    name: 'Riya Sen',
    role: 'Mobile App Developer',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
    },
  },
  {
    id: '7',
    name: 'Rohan Gupta',
    role: 'Security Engineer',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
  {
    id: '8',
    name: 'Isha Verma',
    role: 'QA Automation Lead',
    imageUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/peoples-avatars/no-profile-picture-icon.png',
    socials: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
    },
  },
];

const Team = () => {
  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white min-h-screen relative overflow-hidden transition-colors duration-300">
      {/* Premium accent radial glow in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-orange-500/[0.03] dark:bg-orange-500/[0.05] rounded-full blur-[140px] pointer-events-none" />
      
      <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto relative z-10">
        {/* Centered Typography Header */}
        <div className="flex flex-col items-center mb-16 text-center max-w-3xl mx-auto">
          <ScrollReveal direction="up" delay={0.1}>
            <span className="text-orange-600 dark:text-orange-500 font-bold tracking-[0.2em] text-xs uppercase block mb-3">
              The Innovators
            </span>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.2}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6">
              The Minds Behind <span className="logofont font-light">Campus<span className="text-orange-600 dark:text-orange-500">Node</span></span>
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={0.3}>
            <p className="text-zinc-600 dark:text-zinc-400 text-base md:text-lg leading-relaxed font-light">
              We are student innovators, creators, and engineers building the digital gateway for NITJ.
            </p>
          </ScrollReveal>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
          {TEAM_MEMBERS.map((member, index) => (
            <ScrollReveal
              key={member.id}
              direction="up"
              delay={0.1 + (index % 4) * 0.08}
            >
              <div className="flex flex-col">
                {/* Image Container with square aspect ratio, rounded borders, and scale transition */}
                <figure className="relative aspect-square overflow-hidden rounded-3xl bg-zinc-200 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700/60 transition-colors duration-300 hover:scale-[1.02] transition-transform duration-300 ease-out group">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-black/[0.02] dark:bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </figure>

                {/* Figcaption for Member details & Social integration */}
                <figcaption className="mt-4 flex flex-col gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white tracking-wide leading-snug">
                      {/* {member.name} */}
                      Comming Soon..
                    </h3>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {/* {member.role} */}
                      Comming Soon..
                    </p>
                  </div>

                  {/* Horizontal row of clean monochrome social media icons */}
                  <div className="flex flex-row gap-4 items-center">
                    {member.socials.github && (
                      <a
                        href={member.socials.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors duration-250"
                        aria-label={`${member.name}'s GitHub`}
                      >
                        <Github size={16} />
                      </a>
                    )}
                    {member.socials.linkedin && (
                      <a
                        href={member.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors duration-250"
                        aria-label={`${member.name}'s LinkedIn`}
                      >
                        <Linkedin size={16} />
                      </a>
                    )}
                    {member.socials.twitter && (
                      <a
                        href={member.socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors duration-250"
                        aria-label={`${member.name}'s Twitter/X`}
                      >
                        <Twitter size={16} />
                      </a>
                    )}
                  </div>
                </figcaption>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Team;