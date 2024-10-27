"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Avatar } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { ChevronsLeftRight, Router } from "lucide-react";
import { useCookies } from "next-client-cookies";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type User = {
    id: string;
    name: string;
    email: string;
}

export default function UserItem({ currentUser } : { currentUser: User }) {

    const router = useRouter();
    const cookies = useCookies();

    const handleLogout = (e: React.ChangeEvent<any>) => {
        e.preventDefault();

        if (!localStorage.getItem('AuthorizationToken') != null) {
            localStorage.removeItem("AuthorizationToken");
        }

        if (cookies.get('refreshToken') != null) {
            cookies.remove('refreshToken');
        }

        toast.success("Successfully logged out");
        const logoutRedirectTimeout = setTimeout(() => {
            router.push("/");
        }, 2000);

        return () => clearTimeout(logoutRedirectTimeout);
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div role="button" className="flex items-center text-sm p-3 w-full hover:bg-primary/5">
                    <div className="gap-x-2 flex items-center max-w-[150px] w-full">
                        <Avatar className="h-[1.375rem] w-[1.375rem] rounded">
                            <AvatarImage src="/static/images/avatar.jpg"></AvatarImage>
                        </Avatar>
                        {
                        currentUser.name
                        &&
                        <span className="text-start font-semibold font-inter line-clamp-1">
                            {currentUser.name}&apos;s QuickNotes
                        </span>
                        }
                        <span className="text-start font-semibold font-inter line-clamp-1">
                        </span>
                    </div>
                    <ChevronsLeftRight className="rotate-90 ml-6 text-muted-foreground h-4 w-4" />
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align="start" alignOffset={11} forceMount>
                <div className="flex flex-col space-y-4 p-2">
                    <p className="text-xs font-medium leading-none text-muted-foreground">
                        {currentUser.email}
                    </p>
                    <div className="flex items-center gap-x-2">
                        <div className="rounded-md bg-secondary p-1">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/static/images/avatar.jpg" />
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm line-clamp-1 font-inter">
                                {currentUser.name}&apos;s QuickNotes
                            </p>
                        </div>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="font-inter w-full cursor-pointer text-muted-foreground">
                    Logout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}