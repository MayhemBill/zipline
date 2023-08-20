import type { Response } from '@/lib/api/response';
import type { SafeConfig } from '@/lib/config/safe';
import { fetchApi } from '@/lib/fetchApi';
import useAvatar from '@/lib/hooks/useAvatar';
import useLogin from '@/lib/hooks/useLogin';
import { isAdministrator } from '@/lib/role';
import { useUserStore } from '@/lib/store/user';
import {
  AppShell,
  Avatar,
  Box,
  Burger,
  Button,
  Header,
  MediaQuery,
  Menu,
  NavLink,
  Navbar,
  Paper,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { useClipboard } from '@mantine/hooks';
import { useModals } from '@mantine/modals';
import { showNotification } from '@mantine/notifications';
import {
  IconChevronDown,
  IconChevronRight,
  IconClipboardCopy,
  IconExternalLink,
  IconFileText,
  IconFileUpload,
  IconFiles,
  IconFolder,
  IconHome,
  IconLink,
  IconLogout,
  IconRefreshDot,
  IconSettingsFilled,
  IconShieldLockFilled,
  IconTags,
  IconUpload,
  IconUsersGroup,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import ConfigProvider from './ConfigProvider';

type NavLinks = {
  label: string;
  icon: React.ReactNode;
  active: (path: string) => boolean;
  href?: string;
  links?: NavLinks[];
  if?: (user: Response['/api/user']['user'], config: SafeConfig) => boolean;
};

const navLinks: NavLinks[] = [
  {
    label: 'Home',
    icon: <IconHome size='1rem' />,
    active: (path: string) => path === '/dashbaord',
    href: '/dashboard',
  },
  {
    label: 'Files',
    icon: <IconFiles size='1rem' />,
    active: (path: string) => path === '/dashboard/files',
    href: '/dashboard/files',
  },
  {
    label: 'Folders',
    icon: <IconFolder size='1rem' />,
    active: (path: string) => path === '/dashboard/folders',
    href: '/dashboard/folders',
  },
  {
    label: 'Upload',
    icon: <IconUpload size='1rem' />,
    active: (path: string) => path.startsWith('/dashboard/upload'),
    links: [
      {
        label: 'File',
        icon: <IconFileUpload size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/file',
        href: '/dashboard/upload/file',
      },
      {
        label: 'Text',
        icon: <IconFileText size='1rem' />,
        active: (path: string) => path === '/dashboard/upload/text',
        href: '/dashboard/upload/text',
      },
    ],
  },
  {
    label: 'URLs',
    icon: <IconLink size='1rem' />,
    active: (path: string) => path === '/dashboard/urls',
    href: '/dashboard/urls',
  },
  {
    label: 'Administrator',
    icon: <IconShieldLockFilled size='1rem' />,
    if: (user) => isAdministrator(user?.role),
    active: (path: string) => path.startsWith('/dashboard/admin'),
    links: [
      {
        label: 'Users',
        icon: <IconUsersGroup size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/users',
        href: '/dashboard/admin/users',
      },
      {
        label: 'Invites',
        icon: <IconTags size='1rem' />,
        active: (path: string) => path === '/dashboard/admin/invites',
        href: '/dashboard/admin/invites',
        if: (_, config) => config.invites.enabled,
      },
    ],
  },
];

export default function Layout({ children, config }: { children: React.ReactNode; config: SafeConfig }) {
  const theme = useMantineTheme();
  const [opened, setOpened] = useState(false);
  const router = useRouter();
  const modals = useModals();
  const clipboard = useClipboard();
  const [setUser, setToken] = useUserStore((s) => [s.setUser, s.setToken]);

  const { user, mutate } = useLogin();
  const { avatar } = useAvatar();

  const copyToken = () => {
    modals.openConfirmModal({
      title: (
        <Title order={4} weight={700}>
          Copy token?
        </Title>
      ),
      children:
        'Are you sure you want to copy your token? Your token can interact with all parts of Zipline. Do not share this token with anyone.',
      labels: { confirm: 'Copy', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.message,
            color: 'red',
            icon: <IconClipboardCopy size='1rem' />,
          });
        } else {
          clipboard.copy(data?.token);
          showNotification({
            title: 'Copied',
            message: 'Your token has been copied to your clipboard.',
            color: 'green',
            icon: <IconClipboardCopy size='1rem' />,
          });
        }
      },
    });
  };

  const refreshToken = () => {
    modals.openConfirmModal({
      title: (
        <Title order={4} weight={700}>
          Refresh token?
        </Title>
      ),

      children:
        'Are you sure you want to refresh your token? Once you refresh/reset your token, you will need to update any scripts or applications that use your token.',
      labels: { confirm: 'Refresh', cancel: 'No, close this popup' },
      onConfirm: async () => {
        const { data, error } = await fetchApi<Response['/api/user/token']>('/api/user/token', 'PATCH');
        if (error) {
          showNotification({
            title: 'Error',
            message: error.message,
            color: 'red',
            icon: <IconRefreshDot size='1rem' />,
          });
        } else {
          setToken(data?.token);
          setUser(data?.user);
          mutate(data as Response['/api/user']);

          showNotification({
            title: 'Refreshed',
            message: 'Your token has been refreshed.',
            color: 'green',
            icon: <IconRefreshDot size='1rem' />,
          });
        }
      },
    });
  };

  return (
    <AppShell
      styles={{
        main: {
          background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      navbarOffsetBreakpoint='sm'
      asideOffsetBreakpoint='sm'
      navbar={
        <Navbar hiddenBreakpoint='sm' hidden={!opened} width={{ sm: 200, lg: 230 }}>
          {navLinks
            .filter((link) => !link.if || link.if(user as Response['/api/user']['user'], config))
            .map((link) => {
              if (!link.links) {
                return (
                  <NavLink
                    key={link.label}
                    label={link.label}
                    icon={link.icon}
                    variant='light'
                    rightSection={<IconChevronRight size='0.7rem' />}
                    active={router.pathname === link.href}
                    component={Link}
                    href={link.href || ''}
                  />
                );
              } else {
                return (
                  <NavLink
                    key={link.label}
                    label={link.label}
                    icon={link.icon}
                    variant='light'
                    rightSection={<IconChevronRight size='0.7rem' />}
                    defaultOpened={link.active(router.pathname)}
                  >
                    {link.links
                      .filter(
                        (sublink) => !sublink.if || sublink.if(user as Response['/api/user']['user'], config),
                      )
                      .map((sublink) => (
                        <NavLink
                          key={sublink.label}
                          label={sublink.label}
                          icon={sublink.icon}
                          rightSection={<IconChevronRight size='0.7rem' />}
                          variant='light'
                          active={router.pathname === sublink.href}
                          component={Link}
                          href={sublink.href || ''}
                        />
                      ))}
                  </NavLink>
                );
              }
            })}

          <Box mt='auto'>
            {config.website.externalLinks.map(({ name, url }) => (
              <NavLink
                key={name}
                label={name}
                icon={<IconExternalLink size='1rem' />}
                variant='light'
                component={Link}
                href={url}
                target='_blank'
              />
            ))}
          </Box>
        </Navbar>
      }
      header={
        <Header height={{ base: 50, md: 70 }} p='md'>
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <MediaQuery largerThan='sm' styles={{ display: 'none' }}>
              <Burger
                opened={opened}
                onClick={() => setOpened((o) => !o)}
                size='sm'
                color={theme.colors.gray[6]}
                mr='xl'
              />
            </MediaQuery>

            <Text size={30} weight={700}>
              Zipline
            </Text>

            <div style={{ marginLeft: 'auto' }}>
              <Menu shadow='md' width={200}>
                <Menu.Target>
                  <Button
                    variant='subtle'
                    leftIcon={
                      avatar ? (
                        <Avatar src={avatar} radius='sm' size='sm' alt={user?.username ?? 'User avatar'} />
                      ) : (
                        <IconSettingsFilled size='1rem' />
                      )
                    }
                    rightIcon={<IconChevronDown size='0.7rem' />}
                    size='sm'
                  >
                    {user?.username}
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>
                    {user?.username}
                    {isAdministrator(user?.role) ? ' (Administrator)' : ''}
                  </Menu.Label>

                  <Menu.Item icon={<IconClipboardCopy size='1rem' />} onClick={copyToken}>
                    Copy token
                  </Menu.Item>
                  <Menu.Item color='red' icon={<IconRefreshDot size='1rem' />} onClick={refreshToken}>
                    Refresh token
                  </Menu.Item>
                  <Menu.Divider />

                  <Menu.Item
                    icon={<IconSettingsFilled size='1rem' />}
                    component={Link}
                    href='/dashboard/settings'
                  >
                    Settings
                  </Menu.Item>

                  <Menu.Divider />
                  <Menu.Item
                    color='red'
                    icon={<IconLogout size='1rem' />}
                    component={Link}
                    href='/auth/logout'
                  >
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          </div>
        </Header>
      }
    >
      <ConfigProvider config={config}>
        <Paper m={2} withBorder p='xs'>
          {children}
        </Paper>
      </ConfigProvider>
    </AppShell>
  );
}
