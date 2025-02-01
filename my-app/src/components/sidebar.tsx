"use client";

import { Bot, Brain, ChevronRight, ChevronsLeft, Home, Inbox, LayoutPanelTop, MenuIcon, Plus, PlusCircle, Search, Settings, Trash } from "lucide-react";
import { ElementRef, useEffect, useRef, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import UserItem from "./user_item";
import Notes from "./notes";
import Link from "next/link";
import { backendURL } from "@/app/utils/constants";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Item } from "./item";
import { createDocument, Document, getDocuments } from "@/app/services/documentServices";
import { toast } from "sonner";
import { DocumentList } from "./document_list";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import TrashBox from "./trashbox";
import { useSearch } from "@/hooks/use-search";
import { useSettings } from "@/hooks/use-settings";
import SecondaryNavbar from "./secondary-navbar";
import { useCookies } from "next-client-cookies";

type User = {
    id: string;
    name: string;
    email: string;
};


export default function SideBar({ currentUser }: { currentUser: User}) {
    const params = useParams();
    const pathName = usePathname();
    const isMobile = useMediaQuery("(max-width: 768px)");

    const search = useSearch();
    const settings = useSettings();
    
    const isResizingRef = useRef(false);
    const sidebarRef = useRef<ElementRef<"aside">>(null);
    const navbarRef = useRef<ElementRef<"div">>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(isMobile);

    const router = useRouter();

    const queryClient = useQueryClient();

    const cookies = useCookies();

    // Mutation to Create New Document
    const createDocumentMutate = useMutation({
        mutationFn: createDocument,
		onError: () => {
			toast.error("Failed to create new note.")
		},
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["documents"] });
            toast.success("Created new note.");
            router.push(`/documents/${data._id}`);
        },
    });

    const handleCreateNewDocument = () => {
        createDocumentMutate.mutate({authorizationToken: cookies.get("AuthorizationToken")});
    }
 
    useEffect(() => {
        if (isMobile) {
            collapse();
        }
        else {
            resetWidth();
        }
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) {
            collapse();
        }
    }, [pathName, isMobile]);

    const handleMouseDown = (
        event: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
        event.preventDefault();
        event.stopPropagation();

        isResizingRef.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    const handleMouseMove = (event: MouseEvent) => {
        if (!isResizingRef.current) return;

        let newWidth = event.clientX;

        if (newWidth < 240) newWidth = 240;
        if (newWidth > 480) newWidth = 480;

        if (sidebarRef.current && navbarRef.current) {
            sidebarRef.current.style.width = `${newWidth}px`;
            navbarRef.current.style.setProperty("left", `${newWidth}px`);
            navbarRef.current.style.setProperty("width", `calc(100% - ${newWidth}px)`);
        }
    }

    const handleMouseUp = () => {
        isResizingRef.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    }

    const resetWidth = () => {
        if (sidebarRef.current && navbarRef.current) {
            setIsCollapsed(false);
            setIsResetting(true);

            sidebarRef.current.style.width = isMobile ? "100%" : "240px";
            navbarRef.current.style.setProperty("width", isMobile ? "0" : "calc(100% - 240px)");
            navbarRef.current.style.setProperty("left", isMobile ? "100%" : "240px");
            setTimeout(() => setIsResetting(false), 300);
        }
    }

    const collapse = () => {
        if (sidebarRef.current && navbarRef.current) {
            setIsCollapsed(true);
            setIsResetting(true);

            sidebarRef.current.style.width = "0";
            navbarRef.current.style.setProperty("width", "100%");
            navbarRef.current.style.setProperty("left", "0");
            setTimeout(() => setIsResetting(false), 300);
        }
    }

    return (
        <>
            <aside
                ref={sidebarRef}
                className={cn(
                    "group/sidebar h-full bg-[#F7F7F5] dark:bg-[#1F1F1F] overflow-y-auto relative flex w-60 flex-col z-[999]",
                    isResetting && "transition-all ease-in-out duration-300",
                    isMobile && "w-0"
                )}
            >
                <div 
                    onClick={collapse}
                    role="button" 
                    className={cn(
                        "h-6 w-6 text-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
                        isMobile && "opacity-100"
                    )}>
                    <ChevronsLeft className="h-6 w-6" />
                </div>
                <div>
                    <UserItem currentUser={currentUser} />
                    <Item label="Search" icon={Search} isSearch onClick={search.onOpen} />
                    <Item label="Settings" icon={Settings} onClick={settings.onOpen} />
                    <Item onClick={handleCreateNewDocument}  label="New page" icon={PlusCircle} />
                    <Item label="QuickNotes AI" icon={Brain} />
                </div>
                
                <div className="mt-4">
                    <div className="pl-3 pr-3">
                        <div>
                            <span className="font-inter text-[#91918E] text-xs leading-[0.75rem]">Notes</span>
                        </div>
                    </div>
                    <DocumentList />
                    <Item 
                        onClick={handleCreateNewDocument}
                        icon={Plus}
                        label="Add a page"
                     />
                     <Popover>
                        <PopoverTrigger className="w-full mt-4">
                            <Item label="Trash" icon={Trash} />
                        </PopoverTrigger>
                        <PopoverContent
                            className="p-0 w-72"
                            side={isMobile ? "bottom" : "right"} 
                        >
                            <TrashBox />
                        </PopoverContent>
                     </Popover>

                     <Item 
                        onClick={ () => router.push('/templates') }
                        label = "Templates"
                        icon = {LayoutPanelTop}
                     />
                </div>
                <div
                    onMouseDown={handleMouseDown}
                    onClick={resetWidth} 
                    className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 bg-primary-black/10 right-0 top-0"
                >
                </div>
            </aside>

            <div
                ref={navbarRef}
                className={cn(
                    "absolute top-0 z-[99999] left-60 w-[calc(100%-240px)]",
                    isResetting && "transition-all ease-in-out duration-300",
                    isMobile && "left-0 w-full"
                )}
            >
                {!!params.documentId ? (
                    <SecondaryNavbar 
                        isCollapsed={isCollapsed}
                        onResetWidth={resetWidth}
                    />
                ) : (
                    <nav className="bg-transparent px-3 py-2 w-full">
                        {isCollapsed && <MenuIcon onClick={resetWidth} role="button" className="h-6 w-6 text-muted-foreground" />}
                    </nav>
                )}

            </div>
        </>

        // <aside className="h-screen">
        //     <div className="h-full max-w-64 px-4 py-4 bg-[#F7F7F5]">
        //         <div className="flex justify-between mb-1.5">
        //             <div className="flex items-center">
        //                 <Image className="mr-[0.438rem] rounded-md" src={profileIcon} alt="Profile Picture Icon"></Image>
        //                 <span className="font-inter font-medium text-sm leading-5 text-[#37352F] mr-[0.438rem]">New Space</span>
        //                 <Image src={downArrow} alt="Down Arrow Icon"></Image>
        //             </div>
        //             <div>
        //                 <Image src={createIcon} alt="Create New Note Icon"></Image>
        //             </div>
        //         </div>

        //         <div className="mb-4">
        //             <ul>
        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Search</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">QuickNotes AI</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={homeIcon} alt="Home Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Home</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={inboxIcon} alt="Inbox Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Index</a>
        //                 </li>
        //             </ul>
        //         </div>

        //         <div className="mb-7">
        //             <span className="font-inter text-[#91918E] text-xs leading-3 font-medium py-[0.563rem]">Favourites</span>
        //             <ul>
        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Search</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">QuickNotes AI</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={homeIcon} alt="Home Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Home</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={inboxIcon} alt="Inbox Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Index</a>
        //                 </li>
        //             </ul>
        //         </div>

        //         <div className="mb-7">
        //             <span className="font-inter text-[#91918E] text-xs leading-3 font-medium py-[0.563rem]">Private</span>
        //             <ul>
        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Academics</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">New Page</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={homeIcon} alt="Home Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">More</a>
        //                 </li>
        //             </ul>
        //         </div>

        //         <div className="mb-7">
        //             <ul>
        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={searchIcon} alt="Search Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Settings</a>
        //                 </li>

        //                 <li className="flex py-1 items-center">
        //                     <Image className="mr-2 w-5 h-5" src={aiIcon} alt="AI Icon"></Image>
        //                     <a className="font-medium font-inter text-[#5F5E5B] text-sm leading-[1.313rem]">Trash</a>
        //                 </li>
        //             </ul>
        //         </div>
        //     </div>
        // </aside>
    );
}