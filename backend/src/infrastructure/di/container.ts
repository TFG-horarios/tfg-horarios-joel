export class Container {
  private instances = new Map<string, any>();

  register<T>(key: string, instance: T): void {
    this.instances.set(key, instance);
  }

  resolve<T>(key: string): T {
    if (!this.instances.has(key)) {
      throw new Error(`Dependency ${key} not registered in DI container`);
    }
    return this.instances.get(key) as T;
  }
}

export const container = new Container();

export const DI_TOKENS = {
  OrganizationRepository: 'OrganizationRepository',
  ListOrganizationsUseCase: 'ListOrganizationsUseCase',
  CreateOrganizationUseCase: 'CreateOrganizationUseCase',
  UserRepository: 'UserRepository',
  ListUsersUseCase: 'ListUsersUseCase',
  ClassroomRepository: 'ClassroomRepository',
  ListClassroomsUseCase: 'ListClassroomsUseCase',
  CreateClassroomUseCase: 'CreateClassroomUseCase',
  SubjectRepository: 'SubjectRepository',
  ListSubjectsUseCase: 'ListSubjectsUseCase',
  CreateSubjectUseCase: 'CreateSubjectUseCase',
  SubjectGroupRepository: 'SubjectGroupRepository',
  ListSubjectGroupsUseCase: 'ListSubjectGroupsUseCase',
  CreateSubjectGroupUseCase: 'CreateSubjectGroupUseCase',
  OrganizationMemberRepository: 'OrganizationMemberRepository',
  AssignRoleUseCase: 'AssignRoleUseCase',
  JwtService: 'JwtService',
  PasswordHasherService: 'PasswordHasherService',
  LoginUseCase: 'LoginUseCase',
  RegisterUseCase: 'RegisterUseCase',
};
