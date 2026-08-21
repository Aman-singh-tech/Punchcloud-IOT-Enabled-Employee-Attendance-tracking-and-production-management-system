import { BadRequestException, Controller, Get, Param, ParseIntPipe, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/roles.enum";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

// Notification.audience uses its own "HR" | "EMPLOYEE" vocabulary, distinct from
// Role.EMPLOYEE (= "Employee") — never cast one to the other directly.
function audienceOf(user: AuthenticatedUser): "HR" | "EMPLOYEE" {
  return user.role === Role.HR ? "HR" : "EMPLOYEE";
}

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @Roles(Role.HR, Role.EMPLOYEE)
  list(@CurrentUser() user: AuthenticatedUser, @Query("unread") unread?: string) {
    const unreadOnly = unread === "true";
    if (user.role === Role.HR) {
      return this.notificationsService.listForHr(unreadOnly);
    }
    if (!user.employeeId) {
      throw new BadRequestException("This account is not linked to an employee record");
    }
    return this.notificationsService.listForEmployee(user.employeeId, unreadOnly);
  }

  @Get("unread-count")
  @Roles(Role.HR, Role.EMPLOYEE)
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    const count =
      user.role === Role.HR
        ? await this.notificationsService.unreadCountForHr()
        : await this.notificationsService.unreadCountForEmployee(user.employeeId!);
    return { count };
  }

  @Patch(":id/read")
  @Roles(Role.HR, Role.EMPLOYEE)
  markRead(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markRead(id, audienceOf(user), user.employeeId ?? undefined);
  }

  @Patch("read-all")
  @Roles(Role.HR, Role.EMPLOYEE)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(audienceOf(user), user.employeeId ?? undefined);
  }
}
