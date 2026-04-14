import React from 'react'
import ScrollReveal from '../components/ScrollReveal';
import {ArrowRightIcon} from '../components/ui/arrow-right';
import { InstagramIcon } from '@/components/ui/instagram';
import { GithubIcon } from '@/components/ui/github';
import { LinkedinIcon } from '@/components/ui/linkedin';
import { MailIcon } from 'lucide-react';
import { AtSignIcon } from '@/components/ui/at-sign';
import { EarthIcon } from '@/components/ui/earth';



const Team = () => {


    const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--x-px", `${x}px`);
    e.currentTarget.style.setProperty("--y-px", `${y}px`);
  };

  return (
   <>
   <div className="max-w-7xl mx-auto px-6 py-12">
    <section id="team" className=" scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 text-center">
          <ScrollReveal direction="up">
  <div className="mb-16">
    <h2 className="font-black text-[clamp(32px,4vw,56px)] leading-[1.1] tracking-tight text-black mb-4">
      The Minds Behind <span className="border-b-4 border-orange-600">ClubSetu</span>
    </h2>
    <p className="text-neutral-600 max-w-2xl mx-auto text-[18px] leading-relaxed">
      We are a team of passionate student developers and campus leaders dedicated to 
      bridging the gap between NITJ clubs and students through seamless digital experiences.
    </p>
  </div>
</ScrollReveal>

          {/* Faculty Coordinator */}
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mb-20">
              <div className="inline-block relative">
              
                <div 
                  onMouseMove={handleMouseMove}
                  className="feature-card relative border-2 rounded-sm  border-gray-200 bg-white p-8 max-w-md mx-auto group hover:-translate-y-1 transition-all"
                >
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-24 h-24 shrink-0  border-2 border-gray-500 bg-neutral-500 overflow-hidden flex items-center justify-center">
                      <i className="ri-user-star-line text-4xl text-neutral-300" />
                    </div>
                    <div className="text-left">
                      <div className="text-[11px] font-semibold tracking-[0.2em] text-orange-600 mb-1"> Coordinator</div>
                      <h3 className="text-2xl font-black text-black mb-2">Himanshu Yadav</h3>
                      <div className="flex gap-3 text-neutral-700">
                        <a href="#" className="hover:text-orange-600">
                          <LinkedinIcon/>
                          </a>
                        <a href="#" className="hover:text-orange-600">
                         <AtSignIcon />
                          </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Team Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#",portfolio:"#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
              { name: "Coming Soon", role: "Coming Soon", github: "#", linkedin: "#" },
            ].map((member, i) => (
              <ScrollReveal key={i} direction="up" delay={0.1 + (i * 0.05)}>
                <div 
                  onMouseMove={handleMouseMove}
                  className="feature-card border-2 border-gray-200 bg-white rounded-sm overflow-hidden flex transition-all group"
                >
                  <div className="relative z-10 flex w-full">
                    <div className="w-1/3 aspect-[3/4] bg-neutral-100 border-r-2 border-gray-100 flex items-center justify-center text-neutral-300 overflow-hidden">
                      <i className="ri-user-3-line text-4xl" />
                    </div>
                    <div className="w-2/3 p-4 flex flex-col justify-center text-left">
                      <h3 className="font-bold text-[18px] text-black leading-tight mb-1 transition-colors tracking-wider">{member.name}</h3>
                      <p className="text-[12px] font-medium text-neutral-500 mb-4">{member.role}</p>
                      <div className="flex gap-2.5 mt-auto">
                        <a href={member.github} className="w-8 h-8 flex items-center justify-center  text-black rounded-sm transition-colors">
                          {/* <i className="ri-github-fill" /> */}
                         <GithubIcon/>
                        </a>
                        <a href={member.linkedin} className="w-8 h-8 flex items-center justify-center  text-black rounded-sm transition-colors">
                          <LinkedinIcon/>
                        </a>
                        {member.portfolio && (
                        <a href={member.portfolio} className="w-8 h-8 flex items-center justify-center  text-black rounded-sm transition-colors">
                          <EarthIcon/>
                        </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
   </div>

   </>
  )
}

export default Team