import { useState, useCallback } from "react";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { ChatSidebar } from "@/components/ChatSidebar";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { PanelLeft } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

// Chat bubble component - simplified
const ChatBubbleButton = ({
  onMobileChatOpen,
}: {
  onMobileChatOpen: () => void;
}) => {
  const { toggleSidebar } = useSidebar();

  const handleChatClick = useCallback(() => {
    if (window.innerWidth < 768) {
      onMobileChatOpen();
    } else {
      toggleSidebar();
    }
  }, [onMobileChatOpen, toggleSidebar]);

  return (
    <div
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 no-print z-40 group cursor-pointer"
      onClick={handleChatClick}
    >
      <div className="relative">
        <div className="hidden md:block absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300 animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl md:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
          <div className="absolute inset-0 bg-white/10"></div>
          <div className="relative px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 flex items-center gap-2 sm:gap-3">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3 .97 4.29L2 22l5.71-.97C9 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.29-3.86-.79l-.29-.15-2.99.51.51-2.99-.15-.29C4.79 14.68 4.5 13.38 4.5 12 4.5 7.86 7.86 4.5 12 4.5S19.5 7.86 19.5 12 16.14 19.5 12 19.5z" />
              <circle cx="8" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="16" cy="12" r="1.5" />
            </svg>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm sm:text-base lg:text-xl tracking-wide whitespace-nowrap">
                Geo AI
              </span>
              <span className="hidden sm:block text-white/90 text-[10px] lg:text-xs font-medium tracking-wide whitespace-nowrap">
                Your AI SEO Companion
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Layout = ({ children }: LayoutProps) => {
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const productId = localStorage.getItem("product_id") || "";

  const handleCloseMobileChat = useCallback(() => {
    setIsMobileChatOpen(false);
  }, []);

  const handleMobileChatOpen = useCallback(() => {
    setIsMobileChatOpen(true);
  }, []);

  return (
    <SidebarProvider
      defaultOpen={false}
      style={{ "--sidebar-width": "24rem" } as React.CSSProperties}
    >
      {/* Desktop Sidebar */}
      <Sidebar
        side="left"
        collapsible="offcanvas"
        className="no-print hidden md:flex"
      >
        <SidebarContent>
          <ChatSidebar productId={productId} />
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="flex-1 min-w-0 overflow-x-hidden">
        <div className="min-h-screen bg-background flex flex-col w-full overflow-x-hidden pt-[56px]">
          <Header />
          <Navigation />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Chat Bubble */}
        <ChatBubbleButton onMobileChatOpen={handleMobileChatOpen} />

        {/* Mobile Chat Overlay */}
        {isMobileChatOpen && (
          <div className="fixed inset-0 z-50 bg-background md:hidden overflow-hidden">
            <ChatSidebar
              productId={productId}
              isMobile={true}
              onClose={handleCloseMobileChat}
            />
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
};
