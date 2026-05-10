const publicUserFields = `
  u."Id_User",
  u."Email",
  u."Id_role",
  u."First_name",
  u."Last_name",
  u."Phone",
  u."Created_at",
  u."Login",
  u."Avatar_url",
  u."Birthdate",
  u."Gender",
  u."Country",
  u."City",
  u."Bio",
  u."Social_links",
  u."Settings",
  u."Last_login",
  u."Is_active",
  u."Email_verified",
  r."Role"
`;

const mapUser = (user) => {
  if (!user) return null;
  return {
    id: user.Id_User,
    email: user.Email,
    roleId: user.Id_role,
    role: user.Role,
    firstName: user.First_name,
    lastName: user.Last_name,
    phone: user.Phone,
    createdAt: user.Created_at,
    login: user.Login,
    avatarUrl: user.Avatar_url,
    birthdate: user.Birthdate,
    gender: user.Gender,
    country: user.Country,
    city: user.City,
    bio: user.Bio,
    socialLinks: user.Social_links,
    settings: user.Settings,
    lastLogin: user.Last_login,
    isActive: user.Is_active,
    emailVerified: user.Email_verified,
  };
};

module.exports = { publicUserFields, mapUser };

