import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { User, UserRole } from "@/context/AuthContext";
import { Edit, IdCard, Mail, Trash2 } from "lucide-react";

interface UserTableProps {
  users: User[];
  role: UserRole;
  onEdit: (user: User) => void;
  onDelete: (userId: string, role: UserRole) => void;
  selectedUsers?: string[];
  onToggleSelect?: (userId: string) => void;
}

const UserTable = ({ users, role, onEdit, onDelete, selectedUsers = [], onToggleSelect }: UserTableProps) => {
  // Function to get permission display name
  const getPermissionName = (permissionId: string): string => {
    const permissionMap: Record<string, string> = {
      all: "All Permissions",
      create_test: "Create Tests",
      view_results: "View Results",
      manage_own_tests: "Manage Tests",
      grade_tests: "Grade Tests",
      view_analytics: "View Analytics",
      take_test: "Take Tests",
      view_own_results: "View Results",
      submit_assignments: "Submit Assignments",
      manage_users: "Manage Users",
      manage_tests: "Manage Tests",
      manage_system: "Manage System"
    };
    return permissionMap[permissionId] || permissionId;
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onToggleSelect) return;
    
    if (checked) {
      users.forEach(user => {
        if (!selectedUsers.includes(user.id)) {
          onToggleSelect(user.id);
        }
      });
    } else {
      users.forEach(user => {
        if (selectedUsers.includes(user.id)) {
          onToggleSelect(user.id);
        }
      });
    }
  };

  const allSelected = users.length > 0 && users.every(user => selectedUsers.includes(user.id));
  const someSelected = users.some(user => selectedUsers.includes(user.id)) && !allSelected;

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No {role === "faculty" ? "faculty members" : "students"} found</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {onToggleSelect && (
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                />
              </TableHead>
            )}
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>ERP ID</TableHead>
            <TableHead>{role === "faculty" ? "Department" : "Course"}</TableHead>
            {role === "faculty" && <TableHead>Permissions</TableHead>}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/50">
              {onToggleSelect && (
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => onToggleSelect(user.id)}
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>
              )}
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {user.name}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  {user.email}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <IdCard className="h-3 w-3 text-muted-foreground" />
                  <Badge variant="outline">{user.erpId || "N/A"}</Badge>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {role === "faculty" ? user.department : user.course}
                </Badge>
              </TableCell>
              {role === "faculty" && (
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user.permissions?.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission.replace(/_/g, " ")}
                      </Badge>
                    )) || <span className="text-muted-foreground text-sm">None</span>}
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(user)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{user.name}</strong> from the system.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(user.id, role)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserTable;
