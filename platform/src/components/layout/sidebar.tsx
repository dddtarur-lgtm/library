"use client"

import Image from "next/image"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Building2, ChevronDown, ShieldCheck } from "lucide-react"
import { memo, useCallback } from "react"

import type { DictionaryType } from "@/lib/get-dictionary"
import type {
  LocaleType,
  NavigationNestedItem,
  NavigationRootItem,
} from "@/types"

import { navigationsData } from "@/data/navigations"

import { i18n } from "@/configs/i18n"
import { ensureLocalizedPathname } from "@/lib/i18n"
import {
  getDictionaryValue,
  isActivePathname,
  titleCaseToCamelCase,
} from "@/lib/utils"

import { useSettings } from "@/hooks/use-settings"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  Sidebar as SidebarWrapper,
  useSidebar,
} from "@/components/ui/sidebar"
import { DynamicIcon } from "@/components/dynamic-icon"
import { cn } from "@/lib/utils"
import { CommandMenu } from "./command-menu"

// Memoized sidebar item link
interface MemoizedItemProps {
  item: NavigationRootItem | NavigationNestedItem
  locale: LocaleType
  pathname: string
  dictionary: DictionaryType
  onItemClick: () => void
}

const MemoizedMenuItem = memo(function MemoizedMenuItem({
  item,
  locale,
  pathname,
  dictionary,
  onItemClick,
}: MemoizedItemProps) {
  const title = getDictionaryValue(
    titleCaseToCamelCase(item.title),
    dictionary.navigation,
    item.title
  )
  const label =
    item.label &&
    getDictionaryValue(titleCaseToCamelCase(item.label), dictionary.label, item.label)

  const badgeText = "badge" in item ? (item as any).badge : undefined
  const badgeVariant = "badgeVariant" in item ? (item as any).badgeVariant : undefined

  // Tooltip content for collapsed state
  const tooltipContent = (
    <div className="flex items-center gap-2 font-medium">
      <span>{title}</span>
      {badgeText && (
        <span
          className={cn(
            "px-1.5 py-0.2 rounded text-[10px] font-bold tracking-tight shadow-xs",
            badgeVariant === "primary"
              ? "bg-blue-600 text-white"
              : badgeVariant === "destructive"
              ? "bg-rose-600 text-white"
              : "bg-amber-500 text-black font-extrabold"
          )}
        >
          {badgeText}
        </span>
      )}
    </div>
  )

  // If the item has nested items, render it with a collapsible dropdown
  if (item.items) {
    const isChildActive = item.items.some((subItem: any) => {
      if (subItem.href) {
        const localized = ensureLocalizedPathname(subItem.href, locale)
        return isActivePathname(localized, pathname, true)
      }
      return false
    })

    return (
      <Collapsible defaultOpen={isChildActive} className="group/collapsible">
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={{ children: tooltipContent }}
            className="w-full justify-between [&[data-state=open]>svg]:rotate-180 relative"
          >
            <span className="flex items-center min-w-0">
              {"iconName" in item && (
                <DynamicIcon name={item.iconName} className="me-2 h-4 w-4 shrink-0" />
              )}
              <span className="truncate group-data-[collapsible=icon]:hidden">{title}</span>
              {"label" in item && (
                <Badge variant="secondary" className="me-2 group-data-[collapsible=icon]:hidden">
                  {label}
                </Badge>
              )}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down group-data-[collapsible=icon]:hidden">
          <SidebarMenuSub>
            {item.items.map((subItem: NavigationNestedItem) => (
              <SidebarMenuItem key={subItem.title}>
                <MemoizedMenuItem
                  item={subItem}
                  locale={locale}
                  pathname={pathname}
                  dictionary={dictionary}
                  onItemClick={onItemClick}
                />
              </SidebarMenuItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  // Otherwise, render the item with a link
  if ("href" in item) {
    const localizedPathname = ensureLocalizedPathname(item.href, locale)
    const isLibraryDetail =
      item.href === "/platform/libraries" && pathname.includes("/platform/libraries/")
    const isActive = isActivePathname(localizedPathname, pathname, true) || isLibraryDetail

    return (
      <SidebarMenuButton
        isActive={isActive}
        onClick={onItemClick}
        tooltip={{ children: tooltipContent }}
        className={cn(
          "relative group-data-[collapsible=icon]:justify-center transition-all",
          isActive &&
            "data-[active=true]:bg-primary/15 data-[active=true]:text-primary data-[active=true]:font-bold data-[active=true]:border data-[active=true]:border-primary/30 shadow-xs"
        )}
        asChild
      >
        <Link href={localizedPathname} prefetch={true} className="flex items-center w-full relative">
          {isActive && (
            <span className="absolute -left-2 top-1 bottom-1 w-1 rounded-r-full bg-primary" />
          )}
          {"iconName" in item && (
            <DynamicIcon
              name={item.iconName}
              className={cn("h-4 w-4 shrink-0 transition-colors text-sidebar-foreground/80", isActive && "text-primary")}
            />
          )}
          <span className={cn("truncate group-data-[collapsible=icon]:hidden font-semibold text-sidebar-foreground", isActive && "font-bold text-primary")}>
            {title}
          </span>

          {/* Expanded Badge Pill */}
          {badgeText && (
            <span
              className={cn(
                "ms-auto text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 group-data-[collapsible=icon]:hidden",
                badgeVariant === "primary"
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : badgeVariant === "destructive"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
              )}
            >
              {badgeText}
            </span>
          )}

          {"label" in item && (
            <Badge variant="secondary" className="group-data-[collapsible=icon]:hidden ms-auto">
              {label}
            </Badge>
          )}

          {/* Collapsed Dot Indicator */}
          {badgeText && (
            <span
              className={cn(
                "hidden group-data-[collapsible=icon]:block absolute top-1.5 right-1.5 size-2 rounded-full ring-2 ring-sidebar shadow-xs",
                badgeVariant === "primary"
                  ? "bg-primary"
                  : badgeVariant === "destructive"
                  ? "bg-rose-500"
                  : "bg-amber-500"
              )}
            />
          )}
        </Link>
      </SidebarMenuButton>
    )
  }

  return null
})

export function Sidebar({ dictionary }: { dictionary: DictionaryType }) {
  const pathname = usePathname()
  const params = useParams()
  const { openMobile, setOpenMobile, isMobile } = useSidebar()
  const { settings } = useSettings()

  const locale = params.lang as LocaleType
  const direction = i18n.localeDirection[locale]
  const isRTL = direction === "rtl"
  const isHoizontalAndDesktop = settings.layout === "horizontal" && !isMobile

  const handleItemClick = useCallback(() => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile, setOpenMobile])

  // If the layout is horizontal and not on mobile, don't render the sidebar
  if (isHoizontalAndDesktop) return null

  return (
    <SidebarWrapper side={isRTL ? "right" : "left"} collapsible="icon">
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:items-center">
        <Link
          href={ensureLocalizedPathname("/platform/dashboard", locale)}
          className="w-full flex items-center text-foreground font-black p-2 pb-1 mb-1 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:justify-center"
          onClick={() => isMobile && setOpenMobile(false)}
        >
          <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black text-sm shrink-0 shadow-xs ring-2 ring-primary/20">
            SA
          </div>
          <div className="group-data-[collapsible=icon]:hidden ms-2.5 flex flex-col min-w-0">
            <span className="font-extrabold tracking-tight text-sm leading-tight text-foreground truncate">LMS Platform</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="size-2.5" /> Super Admin HQ
            </span>
          </div>
        </Link>
        <div className="group-data-[collapsible=icon]:hidden">
          <CommandMenu dictionary={dictionary} buttonClassName="max-w-full" />
        </div>
      </SidebarHeader>

      <ScrollArea className="theme-scrollbar">
        <SidebarContent className="gap-0 py-1">
          {navigationsData.map((nav, index) => {
            const title = nav.title
              ? getDictionaryValue(
                  titleCaseToCamelCase(nav.title),
                  dictionary.navigation,
                  nav.title
                )
              : undefined

            return (
              <SidebarGroup key={nav.title || `group-${index}`} className="py-1">
                {title && <SidebarGroupLabel>{title}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {nav.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <MemoizedMenuItem
                          item={item}
                          locale={locale}
                          pathname={pathname}
                          dictionary={dictionary}
                          onItemClick={handleItemClick}
                        />
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )
          })}
        </SidebarContent>
      </ScrollArea>
    </SidebarWrapper>
  )
}
