// 个人信息页面


import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../components/UserProfile';
import { useUser } from '../context/UserContext';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, login } = useUser();

  if (!user) {
    // 未登录时重定向到主页
    navigate('/');
    return null;
  }

  return (
    <UserProfile
      userId={user.id}
      onBack={() => navigate('/')}
      onUserUpdate={(updatedUser) => login(updatedUser)}
    />
  );
}