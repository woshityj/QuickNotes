"use client";

import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { Avatar } from "./ui/avatar";
import { AvatarImage } from "@radix-ui/react-avatar";
import { ChevronsLeftRight } from "lucide-react";

export default function UserItem() {

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div role="button" className="flex items-center text-sm p-3 w-full hover:bg-primary/5">
                    <div className="gap-x-2 flex items-center max-w-[150px]">
                        <Avatar>
                            <AvatarImage src="/static/images/avatar.jpg"></AvatarImage>
                        </Avatar>
                        <span className="text-start font-semibold font-inter line-clamp-1">
                            Tan Yu Jie&apos;s QuickNotes
                        </span>
                    </div>
                    <ChevronsLeftRight className="rotate-90 ml-2 text-muted-foreground h-4 w-4" />
                </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80" align="start" alignOffset={11} forceMount>
                <div className="flex flex-col space-y-4 p-2">
                    <p className="text-xs font-medium leading-none text-muted-foreground">
                        yujietan84@gmail.com
                    </p>
                    <div className="flex items-center gap-x-2">
                        <div className="rounded-md bg-secondary p-1">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/static/images/avatar.jpg" />
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm line-clamp-1 font-inter">
                                Tan Yu Jie&apos;s QuickNotes
                            </p>
                        </div>
                    </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="font-inter w-full cursor-pointer text-muted-foreground">
                    Signout
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}