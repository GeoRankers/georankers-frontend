import React, { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { getDashboardUsers, DashboardUser } from "@/apiHelpers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Search,
  Calendar as CalendarIcon,
  ExternalLink,
  FileJson,
  Loader2,
  Check,
  RefreshCw,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfDay, endOfDay, isAfter, isBefore, parseISO } from "date-fns";

type SortConfig = {
  key: keyof DashboardUser | "keywords_count" | null;
  direction: "asc" | "desc";
};


export default function Dashboard() {
  const [users, setUsers] = useState<DashboardUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<DashboardUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dateFilterType, setDateFilterType] = useState<"created_at" | "updated_at" | "both">("created_at");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "created_at",
    direction: "desc",
  });
  const { toast } = useToast();

  // Fetch users function (reusable)
  const fetchUsers = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getDashboardUsers();
      setUsers(data);
      setFilteredUsers(data);

      if (isRefresh) {
        toast({
          title: "Success",
          description: "Dashboard data refreshed successfully",
          duration: 2000,
        });
      }
    } catch (error: any) {
      console.error("Failed to fetch dashboard users:", error);
      const errorMessage = error?.message || "Failed to load dashboard data. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search query and date range
  useEffect(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.product_website?.toLowerCase().includes(query)
      );
    }

    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((user) => {
        const fromDate = dateFrom ? startOfDay(dateFrom) : null;
        const toDate = dateTo ? endOfDay(dateTo) : null;

        if (dateFilterType === "created_at") {
          const createdDate = parseISO(user.created_at);
          return (
            (!fromDate || !isBefore(createdDate, fromDate)) &&
            (!toDate || !isAfter(createdDate, toDate))
          );
        }

        if (dateFilterType === "updated_at") {
          const updatedDate = parseISO(user.updated_at);
          return (
            (!fromDate || !isBefore(updatedDate, fromDate)) &&
            (!toDate || !isAfter(updatedDate, toDate))
          );
        }

        if (dateFilterType === "both") {
          const createdDate = parseISO(user.created_at);
          const updatedDate = parseISO(user.updated_at);

          const createdMatches =
            (!fromDate || !isBefore(createdDate, fromDate)) &&
            (!toDate || !isAfter(createdDate, toDate));

          const updatedMatches =
            (!fromDate || !isBefore(updatedDate, fromDate)) &&
            (!toDate || !isAfter(updatedDate, toDate));

          // For "both", either created_at OR updated_at must match
          return createdMatches || updatedMatches;
        }

        return true;
      });
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof DashboardUser];
        let bValue: any = b[sortConfig.key as keyof DashboardUser];

        // Specific handling for keywords count if needed
        if (sortConfig.key === "keywords_count") {
          aValue = a.keywords_list?.length || 0;
          bValue = b.keywords_list?.length || 0;
        }

        if (aValue === bValue) return 0;
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        const comparison = aValue < bValue ? -1 : 1;
        return sortConfig.direction === "asc" ? comparison : -comparison;
      });
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, dateFrom, dateTo, dateFilterType, sortConfig]);

  // Handle sort function
  const handleSort = (key: keyof DashboardUser | "keywords_count") => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Helper to render sort icon
  const renderSortIcon = (key: keyof DashboardUser | "keywords_count") => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="ml-2 h-4 w-4" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4" />
    );
  };

  // Format date to readable format (without year)
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  // Helper function to render boolean badge
  const renderBooleanBadge = (value: boolean | undefined) => {
    if (value === true) {
      return (
        <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 transition-smooth">
          <Check className="w-3 h-3 mr-1" />
          Yes
        </Badge>
      );
    } else if (value === false) {
      return (
        <Badge variant="outline" className="bg-muted/30 text-muted-foreground border-border/50">
          No
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-muted/10 text-muted-foreground/50 border-border/20">
          N/A
        </Badge>
      );
    }
  };


  return (
    <Layout>
      <div className="min-h-screen bg-gradient-bg">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold gradient-text">
                    Users Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Comprehensive overview of all users and their analytics data
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUsers(true)}
                disabled={isRefreshing || isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="card-gradient border-0 shadow-elevated transition-bounce hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                    <p className="text-4xl font-extrabold gradient-text mt-2">
                      {users.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 hero-glow">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-gradient border-0 shadow-elevated transition-bounce hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Filtered Results
                    </p>
                    <p className="text-4xl font-extrabold gradient-text mt-2">
                      {filteredUsers.length}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 hero-glow">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="card-gradient border-0 shadow-elevated transition-bounce hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Total Keywords
                    </p>
                    <p className="text-4xl font-extrabold gradient-text mt-2">
                      {users.reduce(
                        (sum, user) => sum + (user.keywords_list?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-primary/10 hero-glow">
                    <FileJson className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Search and Filter Section */}
          <Card className="card-gradient border-0 shadow-elevated">
            <CardHeader>
              <CardTitle>User Data</CardTitle>
              <CardDescription>
                Search and filter users by name, email, website, or date range
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                {/* Search and Filters in One Line */}
                <div className="flex items-center gap-4 flex-wrap bg-muted/20 p-4 rounded-xl border border-border/50">
                  {/* Search Input */}
                  <div className="relative flex-1 min-w-[300px] group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-12 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 transition-smooth rounded-lg"
                    />
                  </div>

                  {/* Vertical Separator */}
                  <div className="hidden lg:block h-8 w-px bg-border/60 mx-2" />

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Date Filter Type */}
                    <Select value={dateFilterType} onValueChange={(value: "created_at" | "updated_at" | "both") => setDateFilterType(value)}>
                      <SelectTrigger className="w-[120px] h-12 bg-background/50 border-border/50">
                        <SelectValue placeholder="Filter by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="created_at">Created</SelectItem>
                        <SelectItem value="updated_at">Updated</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* From Date */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-[140px] h-12 justify-start text-left font-normal bg-background/50 border-border/50 transition-smooth hover:bg-background/80 ${!dateFrom ? "text-muted-foreground" : ""}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "MMM d") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {/* To Date */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-[140px] h-12 justify-start text-left font-normal bg-background/50 border-border/50 transition-smooth hover:bg-background/80 ${!dateTo ? "text-muted-foreground" : ""}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "MMM d") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          disabled={(date) => dateFrom ? date < dateFrom : false}
                        />
                      </PopoverContent>
                    </Popover>

                    {/* Clear Button */}
                    {(searchQuery || dateFrom || dateTo) && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSearchQuery("");
                          setDateFrom(undefined);
                          setDateTo(undefined);
                        }}
                        className="h-12 px-4 hover:bg-destructive/5 hover:text-destructive group transition-smooth"
                      >
                        <X className="w-4 h-4 mr-2 group-hover:rotate-90 transition-smooth" />
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>


              {/* Table */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                  <p className="text-lg font-semibold mb-2">No users found</p>
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "No user data available"}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("name")}
                          >
                            <div className="flex items-center justify-center">
                              User {renderSortIcon("name")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("email")}
                          >
                            <div className="flex items-center justify-center">
                              Email {renderSortIcon("email")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("product_website")}
                          >
                            <div className="flex items-center justify-center">
                              Website {renderSortIcon("product_website")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("keywords_count")}
                          >
                            <div className="flex items-center justify-center">
                              Keywords {renderSortIcon("keywords_count")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("created_at")}
                          >
                            <div className="flex items-center justify-center">
                              Created {renderSortIcon("created_at")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("updated_at")}
                          >
                            <div className="flex items-center justify-center">
                              Updated {renderSortIcon("updated_at")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("results_generated")}
                          >
                            <div className="flex items-center justify-center text-xs">
                              Results {renderSortIcon("results_generated")}
                            </div>
                          </TableHead>
                          <TableHead
                            className="font-semibold text-center cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => handleSort("analytics_generated")}
                          >
                            <div className="flex items-center justify-center text-xs">
                              Analytics {renderSortIcon("analytics_generated")}
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map((dashboardUser) => (
                          <TableRow
                            key={dashboardUser.id}
                            className="hover:bg-primary/[0.03] transition-colors group/row"
                          >
                            <TableCell className="font-semibold text-center py-4">
                              {dashboardUser.name || <span className="text-muted-foreground italic">N/A</span>}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <a
                                href={`mailto:${dashboardUser.email}`}
                                className="text-primary hover:text-primary-glow font-medium transition-colors hover:underline underline-offset-4"
                              >
                                {dashboardUser.email}
                              </a>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              {dashboardUser.product_website ? (
                                <a
                                  href={dashboardUser.product_website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5 group/link"
                                >
                                  <span className="max-w-[150px] truncate">
                                    {dashboardUser.product_website.replace(/^https?:\/\//, '')}
                                  </span>
                                  <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">N/A</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              {dashboardUser.keywords_list && dashboardUser.keywords_list.length > 0 ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="flex items-center justify-center gap-2 cursor-pointer group/keywords">
                                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 group-hover/keywords:bg-primary/20 transition-smooth">
                                        {dashboardUser.keywords_list.length}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground font-medium group-hover/keywords:text-foreground transition-colors">
                                        keywords
                                      </span>
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-0 shadow-elevated border-border/50 overflow-hidden" align="start">
                                    <div className="p-4 bg-muted/30 border-b border-border/50">
                                      <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-md bg-primary/20">
                                          <Search className="w-4 h-4 text-primary" />
                                        </div>
                                        <h4 className="font-bold text-sm">Keywords ({dashboardUser.keywords_list.length})</h4>
                                      </div>
                                    </div>
                                    <div className="p-4 flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                                      {dashboardUser.keywords_list.map((keyword: string, idx: number) => (
                                        <Badge key={idx} variant="outline" className="text-[11px] bg-background border-border/60 hover:border-primary/50 transition-colors py-0.5">
                                          {keyword}
                                        </Badge>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <div className="flex items-center justify-center gap-2 opacity-50">
                                  <Badge variant="outline" className="bg-muted">0</Badge>
                                  <span className="text-xs text-muted-foreground italic">
                                    none
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm py-4 tabular-nums text-muted-foreground">
                              {formatDate(dashboardUser.created_at)}
                            </TableCell>
                            <TableCell className="text-center text-sm py-4 tabular-nums text-muted-foreground">
                              {formatDate(dashboardUser.updated_at)}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              {renderBooleanBadge(dashboardUser.results_generated)}
                            </TableCell>
                            <TableCell className="text-center py-4">
                              {renderBooleanBadge(dashboardUser.analytics_generated)}
                            </TableCell>
                          </TableRow>

                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

