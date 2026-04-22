import { container, DI_TOKENS } from './container';

import { OrganizationRepository } from '../db/repositories/organization.repository';
import { UserRepository } from '../db/repositories/user.repository';
import { ClassroomRepository } from '../db/repositories/classroom.repository';
import { SubjectRepository } from '../db/repositories/subject.repository';
import { SubjectGroupRepository } from '../db/repositories/subject-group.repository';
import { OrganizationMemberRepository } from '../db/repositories/organization-member.repository';

import { ListOrganizationsUseCase } from '../../application/use-cases/organization/list-organizations.usecase';
import { CreateOrganizationUseCase } from '../../application/use-cases/organization/create-organization.usecase';
import { ListUsersUseCase } from '../../application/use-cases/user/list-users.usecase';
import { ListClassroomsUseCase } from '../../application/use-cases/classroom/list-classrooms.usecase';
import { CreateClassroomUseCase } from '../../application/use-cases/classroom/create-classroom.usecase';
import { ListSubjectsUseCase } from '../../application/use-cases/subject/list-subjects.usecase';
import { CreateSubjectUseCase } from '../../application/use-cases/subject/create-subject.usecase';
import { ListSubjectGroupsUseCase } from '../../application/use-cases/subject-group/list-subject-groups.usecase';
import { CreateSubjectGroupUseCase } from '../../application/use-cases/subject-group/create-subject-group.usecase';
import { LoginUseCase } from '../../application/use-cases/auth/login.usecase';
import { RegisterUseCase } from '../../application/use-cases/auth/register.usecase';

import { JwtService } from '../auth/jwt.service';
import { BunPasswordHasherService } from '../auth/bun-password-hasher.service';

export function registerDependencies() {
  const organizationRepo = new OrganizationRepository();
  container.register(DI_TOKENS.OrganizationRepository, organizationRepo);
  container.register(
    DI_TOKENS.ListOrganizationsUseCase,
    new ListOrganizationsUseCase(organizationRepo)
  );
  container.register(
    DI_TOKENS.CreateOrganizationUseCase,
    new CreateOrganizationUseCase(organizationRepo)
  );

  const userRepo = new UserRepository();
  container.register(DI_TOKENS.UserRepository, userRepo);
  container.register(
    DI_TOKENS.ListUsersUseCase,
    new ListUsersUseCase(userRepo)
  );

  const classroomRepo = new ClassroomRepository();
  container.register(DI_TOKENS.ClassroomRepository, classroomRepo);
  container.register(
    DI_TOKENS.ListClassroomsUseCase,
    new ListClassroomsUseCase(classroomRepo)
  );
  container.register(
    DI_TOKENS.CreateClassroomUseCase,
    new CreateClassroomUseCase(classroomRepo)
  );

  const subjectRepo = new SubjectRepository();
  container.register(DI_TOKENS.SubjectRepository, subjectRepo);
  container.register(
    DI_TOKENS.ListSubjectsUseCase,
    new ListSubjectsUseCase(subjectRepo)
  );
  container.register(
    DI_TOKENS.CreateSubjectUseCase,
    new CreateSubjectUseCase(subjectRepo)
  );

  const subjectGroupRepo = new SubjectGroupRepository();
  container.register(DI_TOKENS.SubjectGroupRepository, subjectGroupRepo);
  container.register(
    DI_TOKENS.ListSubjectGroupsUseCase,
    new ListSubjectGroupsUseCase(subjectGroupRepo)
  );
  container.register(
    DI_TOKENS.CreateSubjectGroupUseCase,
    new CreateSubjectGroupUseCase(subjectGroupRepo)
  );

  const memberRepo = new OrganizationMemberRepository();
  container.register(DI_TOKENS.OrganizationMemberRepository, memberRepo);

  const jwtService = new JwtService();
  const passwordHasherService = new BunPasswordHasherService();
  container.register(DI_TOKENS.JwtService, jwtService);
  container.register(DI_TOKENS.PasswordHasherService, passwordHasherService);
  container.register(
    DI_TOKENS.LoginUseCase,
    new LoginUseCase(userRepo, jwtService, passwordHasherService)
  );
  container.register(
    DI_TOKENS.RegisterUseCase,
    new RegisterUseCase(userRepo, jwtService, passwordHasherService)
  );
}
