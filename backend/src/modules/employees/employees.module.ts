import { Module } from "@nestjs/common";
import { EmployeesService } from "./employees.service";
import { EmployeesController } from "./employees.controller";
import { SalaryStructureRepository } from "./salary-structure.repository";

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, SalaryStructureRepository],
  exports: [EmployeesService, SalaryStructureRepository],
})
export class EmployeesModule {}
