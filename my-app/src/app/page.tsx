import Image from "next/image";
import Link from "next/link";

import NavBar from "./components/navbar";

import homeIllustration from "../public/static/images/hero_illustration_1.png";
import homeIllustration_2 from "../public/static/images/home_illustration_2.png";
import homeIllustration_3 from "../public/static/images/home_illustration_3.png";
import homeIllustration_4 from "../public/static/images/home_illustration_4.png";
import companyWikiIllustration from "../public/static/images/company_wiki_illustration.png";
import homeImage_1 from "../public/static/images/home_image_1.png";

import aiIcon from "../public/static/images/ai_icon.png";
import aiIconType2 from "../public/static/images/ai_icon_2.png";
import aiIconType3 from "../public/static/images/ai_icon_3.png"
import aiIconType4 from "../public/static/images/ai_icon_4.png";
import buildingBlocksIcon from "../public/static/images/building_blocks_icon.png";
import calendarIcon from "../public/static/images/calendar_icon.png";
import customViewIcon from "../public/static/images/custom_view_icon.png";
import documentIcon from "../public/static/images/document_icon.png";
import openBookIcon from "../public/static/images/open_book_icon.png";
import globleIcon from "../public/static/images/globle_icon.png";
import instantAnswersIcon from "../public/static/images/instant_answers_icon.png";
import targetIcon from "../public/static/images/target_icon.png";
import todoIcon from "../public/static/images/todo_icon.png";
import toolsIcon from "../public/static/images/tools_icon.png";
import personalizedEditorIcon from "../public/static/images/personalized_editor_icon.png";
import pinIcon from "../public/static/images/pin_icon.png";

import blueMotorcycleIcon from "../public/static/images/blue_motorcycle_icon.png";
import greenCalendarIcon from "../public/static/images/green_calendar_icon.png";
import purpleTickIcon from "../public/static/images/purple_tick_icon.png";
import redBookIcon from "../public/static/images/red_book_icon.png";
import redTicketIcon from "../public/static/images/red_ticket_icon.png";
import orangeTargetIcon from "../public/static/images/orange_target_icon.png";
import yellowPaperIcon from "../public/static/images/yellow_paper_icon.png";

import ai80by80Icon from "../public/static/images/ai_80x80.png";
import calendar80by80Icon from "../public/static/images/calendar_80x80.png";
import doucment80by80Icon from "../public/static/images/document_80x80_icon.png";
import globe80by80Icon from "../public/static/images/globe_80x80.png";
import shape80by80Icon from "../public/static/images/shape_80x80.png";
import target80by80Icon from "../public/static/images/target_80x80.png";
import trophy80by80Icon from "../public/static/images/trophy_80x80.png";
import wiki80by80Icon from "../public/static/images/wiki_80x80_icon.png";


import asanaLogo from "../public/static/images/asana_logo.png";
import codaLogo from "../public/static/images/coda_logo.png";
import evergreenLogo from "../public/static/images/evergreen_logo.png";
import forbesLogo from "../public/static/images/forbes_logo.png";
import googleDocsLogo from "../public/static/images/google_docs_logo.png";
import mondayLogo from "../public/static/images/monday_logo.png";
import trelloLogo from "../public/static/images/trello_logo.png";
import Footer from "./components/footer";

export default function Home() {
	return(
		<div className="mb-20">
			<NavBar />

			<div className="px-40">
				<div className="flex mt-[1.875rem] mb-28 justify-center">
					<div className="max-w-lg mr-24">
						<h1 className="font-inter font-semibold text-[4.75rem] leading-[4.5rem] text-black mb-[0.938rem]">Work feels better here.</h1>
						<h2 className="font-inter font-medium text-2xl leading-[1.875rem] text-primary-black mb-[0.938rem]">Write, plan, and organize in QuickNotes, the AI-powered workspace for every team</h2>
						<div className="flex">
							<Link href="/signup" className="font-inter font-semibold bg-[#0582FF] text-white rounded-lg px-5 py-2.5 text-base leading-[1.438rem] mr-2">Sign up here</Link>
							<Link href="/login" className="font-inter font-semibold bg-[#EBF5FE] text-[#087FE7] rounded-lg px-5 py-2.5 text-base leading-[1.438rem]">Login here</Link>
						</div>
					</div>
					<div className="">
						<Image src={homeIllustration} alt="Home Page Illustration"></Image>
					</div>
				</div>
				

				<div className="flex items-center flex-col mb-[9.375rem]">
					<Image src={homeImage_1} alt="Example Image of QuickNotes"></Image>

					<div className="flex mt-6">
						<button className="flex font-inter text-base font-medium leading-[1.438rem] px-3 py-[0.313rem] hover:bg-[#0000000a]">
							<Image className="mr-2.5" src={openBookIcon} alt="Open Book Icon"></Image>
							Wikis
						</button>
						<button className="flex font-inter text-base font-medium leading-[1.438rem] px-3 py-[0.313rem] hover:bg-[#0000000a]">
							<Image className="mr-2.5" src={documentIcon} alt="Document Icon"></Image>
							Docs
						</button>
						<button className="flex font-inter text-base font-medium leading-[1.438rem] px-3 py-[0.313rem] hover:bg-[#0000000a]">
							<Image className="mr-2.5" src={targetIcon} alt="Target Icon"></Image>
							Projects
						</button>
						<button className="flex font-inter text-base font-medium leading-[1.438rem] px-3 py-[0.313rem] hover:bg-[#0000000a]">
							<Image className="mr-2.5" src={aiIcon} alt="AI Icon"></Image>
							AI
						</button>
						<button className="flex font-inter text-base font-medium leading-[1.438rem] px-3 py-[0.313rem] hover:bg-[#0000000a]">
							<Image className="mr-2.5"  src={calendarIcon} alt="Calendar Icon"></Image>
							Calendar
						</button>
						<button className="flex font-inter text-base font-medium leading-[1.438rem] px-3 py-[0.313rem] hover:bg-[#0000000a]">
							<Image className="mr-2.5" src={globleIcon} alt="Globle Icon"></Image>
							Sites
						</button>
					</div>
				</div>

				<div className="flex flex-col items-center mb-[9.375rem]">
					<div className="flex justify-between mb-[1.875rem]">
						<div className="max-w-[30.625rem] mr-[3.125rem]">
							<h3 className="font-inter font-semibold text-[3.813rem] leading-[4rem] mb-3">Build perfect docs, together</h3>
							<p className="font-inter font-medium text-lg leading-[1.5rem] text-[#808080] mb-3">Write, plan, and organize in Notion, the AI-powered workspace for every team</p>
							<a className="font-inter font-medium text-lg leading-[1.5rem] text-[#0A85D1]">Explore docs & notes →</a>
						</div>
						
						<div className="grid grid-cols-3 gap-x-6">
							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={buildingBlocksIcon} alt="Building Blocks Icon"></Image> 
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Building Blocks</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">100+ content types to communicate any idea.</span>
							</div>

							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={toolsIcon} alt="Tools Icon"></Image>
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Collaborative tools</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Built for teams to share, suggest, and comment.</span>
							</div>

							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={aiIconType2} alt="AI Icon"></Image>
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">AI-assisted</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Edit, draft, translate. Ask and AI will help.</span>
							</div>
						</div>
					</div>
					

					<div className="w-full">
						<Image className="w-full object-fill" src={homeIllustration_2} alt="Home Illustration 2"></Image>
					</div>

					<div className="items-center justify-self-start flex w-full mt-7 justify-start">
						<span className="font-bold font-inter text-[1rem] leading-6 mr-3">Replaces</span>
						<div className="flex mr-3 justify-center items-center">
							<Image className="mr-[0.188rem]" src={evergreenLogo} alt="Evergreen Logo"></Image>
							<span className="font-inter text-[1rem] text-[#808080] leading-[1.438rem]">Evergreen</span>
						</div>
						<div className="flex mr-3 justify-center items-center">
							<Image className="mr-[0.188rem]" src={googleDocsLogo} alt="Google Docs Logo"></Image>
							<span className="font-inter text-[1rem] text-[#808080] leading-[1.438rem]">Google Docs</span>
						</div>
						<div className="flex mr-3 justify-center items-center">
							<Image className="mr-[0.188rem]" src={codaLogo} alt="Coda Logo"></Image>
							<span className="font-inter text-[1rem] text-[#808080] leading-[1.438rem]">Coda</span>
						</div>
					</div>
				</div>

				<div className="flex flex-col items-center mb-[9.375rem]">
					<div className="flex justify-between mb-[1.875rem]">
						<div className="max-w-[30.625rem] mr-[3.125rem]">
							<h3 className="font-inter font-semibold text-[3.813rem] leading-[4rem] mb-3">Your workflow. Your way.</h3>
							<p className="font-inter font-medium text-lg leading-[1.5rem] text-[#808080] mb-3">
								All your projects, goals, calendar, roadmaps, and more <code>&#8212;</code> in one tool <code>&#8212;</code> personalized 
								to how you and your team work.
							</p>
							<a className="font-inter font-medium text-lg leading-[1.5rem] text-[#0A85D1]">Explore projects →</a>
						</div>
						
						<div className="grid grid-cols-3 gap-x-6">
							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={todoIcon} alt="Todo List Icon"></Image> 
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Tasks and to-dos</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Tackle any project, big or small.</span>
							</div>

							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={customViewIcon} alt="Custom View Icon"></Image>
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Custom Views</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Visualize work in any format, from calendars to boards.</span>
							</div>

							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={aiIconType3} alt="AI Icon"></Image>
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Automated</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Put tedious tasks on autopilot.</span>
							</div>
						</div>
					</div>
					

					<div className="w-full">
						<Image className="w-full object-fill" src={homeIllustration_3} alt="Home Illustration 3"></Image>
					</div>

					<div className="items-center justify-self-start flex w-full mt-7 justify-start">
						<span className="font-bold font-inter text-[1rem] leading-6 mr-3">Replaces</span>
						<div className="flex mr-3 justify-center items-center">
							<Image className="mr-[0.188rem]" src={trelloLogo} alt="Trello Logo"></Image>
							<span className="font-inter text-[1rem] text-[#808080] leading-[1.438rem]">Trello</span>
						</div>
						<div className="flex mr-3 justify-center items-center">
							<Image className="mr-[0.188rem]" src={asanaLogo} alt="Asana Logo"></Image>
							<span className="font-inter text-[1rem] text-[#808080] leading-[1.438rem]">Asana</span>
						</div>
						<div className="flex mr-3 justify-center items-center">
							<Image className="mr-[0.188rem]" src={mondayLogo} alt="Monday Logo"></Image>
							<span className="font-inter text-[1rem] text-[#808080] leading-[1.438rem]">Monday</span>
						</div>
					</div>
				</div>

				<div className="flex justify-center mb-[9.375rem]">
					<div className="-rotate-3 flex relative flex-col items-center bg-[#F6F5F4] p-[3.75rem]">
						<Image className="absolute -top-1/3 left-auto" src={pinIcon} alt="Pin Icon"></Image>
						<h1 className="font-['Georgia'] text-[#121212] text-[2.688rem] leading-[3.125rem]">"Your AI everything app."</h1>
						<Image className="w-[4rem] mt-3" src={forbesLogo} alt="Forbes Logo"></Image>
					</div>
				</div>


				<div className="flex flex-col items-center mb-[9.375rem]">
					<div className="flex justify-between mb-[1.875rem]">
						<div className="max-w-[30.625rem] mr-[3.125rem]">
							<h3 className="font-inter font-semibold text-[3.813rem] leading-[4rem] mb-3">Get a brain boost.</h3>
							<p className="font-inter font-medium text-lg leading-[1.5rem] text-[#808080] mb-3">
								Built right into your workspace, Notion AI is ready to brainstorm, summarize, help you write, and find what
								you're looking for.
							</p>
							<a className="font-inter font-medium text-lg leading-[1.5rem] text-[#0A85D1]">Try QuickNotes AI →</a>
						</div>
						
						<div className="grid grid-cols-3 gap-x-6">
							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={instantAnswersIcon} alt="Todo List Icon"></Image> 
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Instant Answers</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Ask any question about a team's docs and projects.</span>
							</div>

							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={personalizedEditorIcon} alt="Custom View Icon"></Image>
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">Personalized editor</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Generate content that's always relevant</span>
							</div>

							<div className="flex flex-col justify-center col-span-1">
								<Image className="mb-3" src={aiIconType4} alt="AI Icon"></Image>
								<h4 className="font-semibold font-inter text-[1rem] leading-[1.438rem]">AI connectors beta</h4>
								<span className="font-medium font-inter text-[1rem] leading-[1.438rem] text-[#808080]">Access info from Slack, Google Drive and more, right inside QuickNotes</span>
							</div>
						</div>
					</div>
					

					<div className="w-full">
						<Image className="w-full object-fill" src={homeIllustration_4} alt="Home Illustration 4"></Image>
					</div>
				</div>

				<div className="mb-[9.375rem]">
					<div className="mb-[1.875rem]">
						<h3 className="font-inter font-semibold text-[3.813rem] leading-[4rem] mb-3">Start with a template. <br></br> Build anything</h3>
						<a className="font-inter font-medium text-lg leading-[1.5rem] text-[#0A85D1]">Browse all templates →</a>
					</div>

					<div className="grid grid-cols-12 gap-6">
						<div className="col-span-6 pt-6 pl-8 bg-[#F6F5F4] rounded-xl">
							<div className="pr-8 mb-[1.875rem]">
								<Image className="mb-2.5" src={redBookIcon} alt="Open Book Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">Company Wiki →</a>
							</div>
							<Image src={companyWikiIllustration} alt="Company Wiki Illustration"></Image>
						</div>

						<div className="col-span-6 grid grid-cols-6 grid-rows-3 gap-6">
							<div className="col-span-3 px-8 py-6 bg-[#F6F5F4] rounded-xl flex flex-col justify-center">
								<Image className="mb-2.5" src={blueMotorcycleIcon} alt="Blue Motorcycle Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">Project Roadmap →</a>
							</div>

							<div className="col-span-3 px-8 py-6 bg-[#F6F5F4] rounded-xl flex flex-col justify-center">
								<Image className="mb-2.5" src={orangeTargetIcon} alt="Orange Target Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">OKRs →</a>
							</div>

							<div className="col-span-3 px-8 py-6 bg-[#F6F5F4] rounded-xl flex flex-col justify-center">
								<Image className="mb-2.5" src={yellowPaperIcon} alt="Yellow Paper Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">Meeting Notes →</a>
							</div>

							<div className="col-span-3 px-8 py-6 bg-[#F6F5F4] rounded-xl flex flex-col justify-center">
								<Image className="mb-2.5" src={redTicketIcon} alt="Red Ticket Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">Vacation Planner →</a>
							</div>

							<div className="col-span-3 px-8 py-6 bg-[#F6F5F4] rounded-xl flex flex-col justify-center">
								<Image className="mb-2.5" src={greenCalendarIcon} alt="Green Calendar Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">Editorial Calendar →</a>
							</div>

							<div className="col-span-3 px-8 py-6 bg-[#F6F5F4] rounded-xl flex flex-col justify-center">
								<Image className="mb-2.5" src={purpleTickIcon} alt="Purple Tick Icon"></Image>
								<a className="font-inter font-semibold text-lg leading-[1.5rem]">Habit Tracker →</a>
							</div>
						</div>
					</div>
				</div>

				<div className="mb-[6.25rem]">
					<h3 className="font-semibold font-inter text-[3.813rem] leading-[4.063rem]">Everything you need <br></br> to do your best work.</h3>
					<div className="grid grid-cols-4 mt-12 gap-x-6 gap-y-12">
						<div>
							<Image className="mb-3" src={doucment80by80Icon} alt="Document Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Docs →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">Build any page, communicate any idea.</p>
						</div>

						<div>
							<Image className="mb-3" src={wiki80by80Icon} alt="Wiki Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Wiki →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">One home base for all your knowledge.</p>
						</div>

						<div>
							<Image className="mb-3" src={target80by80Icon} alt="Target Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Projects →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">Manage any project from beginning to end</p>
						</div>

						<div>
							<Image className="mb-3" src={ai80by80Icon} alt="AI Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">QuickNotes AI →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">Finds what you need. Does what you need.</p>
						</div>

						<div>
							<Image className="mb-3" src={calendar80by80Icon} alt="Calendar Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Calendar →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">See all your commitments in one place</p>
						</div>

						<div>
							<Image className="mb-3" src={trophy80by80Icon} alt="Trophy Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Goals →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">Track progress toward what's most important</p>
						</div>

						<div>
							<Image className="mb-3" src={globe80by80Icon} alt="Globe Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Sites →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">Make any page a website in minutes.</p>
						</div>

						<div>
							<Image className="mb-3" src={shape80by80Icon} alt="Shapes Icon"></Image>
							<h4 className="font-inter font-semibold text-2xl leading-[1.875rem]">Templates →</h4>
							<p className="font-inter font-medium text-[1.125rem] leading-6 text-[#808080]">Get started with one of 20,000+ templates.</p>
						</div>
					</div>
				</div>
				
				<Footer />
			</div>
		</div>
	);
}
