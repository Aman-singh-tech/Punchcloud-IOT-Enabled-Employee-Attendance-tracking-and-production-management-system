import { IsIn } from "class-validator";

export class UpdateLeaveStatusDto {
  @IsIn(["approved", "rejected"])
  status!: "approved" | "rejected";
}
