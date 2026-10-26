"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer"

import { useMediaQuery } from "@/hooks/use-media-query"
import { MRForm } from "./MrForm"

export function Navbar() {

    const [open, setOpen] = useState(false)

    // bottom sheet on phones, side panel on tablets and desktop
    const isWide = useMediaQuery("(min-width: 768px)")

    return (
        <header className="sticky top-0 z-30 border-b bg-white">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

                <div className="font-semibold text-lg">
                    MR Visit System
                </div>

                <Drawer
                    direction={isWide ? "left" : "bottom"}
                    open={open}
                    onOpenChange={setOpen}
                >
                    <DrawerTrigger asChild>
                        <Button className="h-10 cursor-pointer md:h-8">
                            <Plus />
                            Add MR
                        </Button>
                    </DrawerTrigger>

                    <DrawerContent className="md:p-6">
                        <div className="mx-auto w-full max-w-md overflow-y-auto px-4 pb-6 md:px-0">
                            <DrawerHeader className="px-0">
                                <DrawerTitle>Register New MR</DrawerTitle>
                                <DrawerDescription>
                                    Add a medical representative to the system.
                                </DrawerDescription>
                            </DrawerHeader>

                            <div className="mt-2 md:mt-6">
                                <MRForm
                                    onSuccess={() => {
                                        setOpen(false)
                                    }}
                                />
                            </div>
                        </div>
                    </DrawerContent>
                </Drawer>

            </div>
        </header>
    )
}
