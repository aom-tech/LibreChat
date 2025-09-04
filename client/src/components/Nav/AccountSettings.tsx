import { useState, memo } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import * as Select from '@ariakit/react/select';
import { FileText, LogOut, Link } from 'lucide-react';
import { LinkIcon, GearIcon, DropdownMenuSeparator, UserIcon } from '@librechat/client';
import { useGetStartupConfig, useGetUserBalance } from '~/data-provider';
import FilesView from '~/components/Chat/Input/Files/FilesView';
import { useAuthContext } from '~/hooks/AuthContext';
import useAvatar from '~/hooks/Messages/useAvatar';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';
import Settings from './Settings';
import store from '~/store';

function AccountSettings() {
  const localize = useLocalize();
  const { user, isAuthenticated, logout } = useAuthContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { showToast } = useToastContext();
  const currentUser = useRecoilValue(store.user);
  const balanceQuery = useGetUserBalance({
    enabled: !!isAuthenticated && startupConfig?.balance?.enabled,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showFiles, setShowFiles] = useRecoilState(store.showFiles);
  const [copying, setCopying] = useState(false);

  const avatarSrc = useAvatar(user);
  const avatarSeed = user?.avatar || user?.name || user?.username || '';

  // Generate simple referral code
  const generateReferralCode = () => {
    if (currentUser?.personalReferralCode) {
      return currentUser.personalReferralCode;
    }

    const userId = currentUser?.id;
    if (userId) {
      return userId.slice(-8).toUpperCase();
    }

    if (currentUser?.email) {
      const hash = currentUser.email
        .split('')
        .reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & 0xffffffff, 0);
      return Math.abs(hash).toString(36).slice(0, 8).toUpperCase();
    }

    return 'DEMO123';
  };

  const handleCopyReferralLink = async () => {
    if (copying) return;

    const referralCode = generateReferralCode();
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(referralLink);
      showToast({ message: localize('com_ui_referral_copied_success'), status: 'success' });
    } catch (error) {
      showToast({ message: localize('com_ui_referral_copy_failed'), status: 'error' });
    } finally {
      setTimeout(() => setCopying(false), 1000);
    }
  };

  return (
    <Select.SelectProvider>
      <Select.Select
        aria-label={localize('com_nav_account_settings')}
        data-testid="nav-user"
        className="mt-text-sm flex h-auto w-full items-center gap-2 rounded-xl p-2 text-sm transition-all duration-200 ease-in-out hover:bg-surface-hover"
      >
        <div className="-ml-0.9 -mt-0.8 h-8 w-8 flex-shrink-0">
          <div className="relative flex">
            {avatarSeed.length === 0 ? (
              <div
                style={{
                  backgroundColor: 'rgb(121, 137, 255)',
                  width: '32px',
                  height: '32px',
                  boxShadow: 'rgba(240, 246, 252, 0.1) 0px 0px 0px 1px',
                }}
                className="relative flex items-center justify-center rounded-full p-1 text-text-primary"
                aria-hidden="true"
              >
                <UserIcon />
              </div>
            ) : (
              <img
                className="rounded-full"
                src={(user?.avatar ?? '') || avatarSrc}
                alt={`${user?.name || user?.username || user?.email || ''}'s avatar`}
              />
            )}
          </div>
        </div>
        <div
          className="mt-2 grow overflow-hidden text-ellipsis whitespace-nowrap text-left text-text-primary"
          style={{ marginTop: '0', marginLeft: '0' }}
        >
          {user?.name ?? user?.username ?? localize('com_nav_user')}
        </div>
      </Select.Select>
      <Select.SelectPopover
        className="popover-ui w-[235px]"
        style={{
          transformOrigin: 'bottom',
          marginRight: '0px',
          translate: '0px',
        }}
      >
        <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
          {user?.email ?? localize('com_nav_user')}
        </div>
        <DropdownMenuSeparator />
        {startupConfig?.balance?.enabled === true && balanceQuery.data != null && (
          <>
            {balanceQuery.data.availableCredits ? (
              <div
                className="text-token-text-secondary ml-3 mr-2 space-y-1 py-2 text-sm"
                role="note"
              >
                <div className="mb-1 font-medium">{localize('com_nav_available_credits')}:</div>
                <div className="space-y-1 pl-2">
                  <div className="flex justify-between">
                    <span>{localize('com_nav_credits_text')}:</span>
                    <span>
                      {new Intl.NumberFormat().format(
                        Math.round(balanceQuery.data.availableCredits.text),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{localize('com_nav_credits_image')}:</span>
                    <span>
                      {new Intl.NumberFormat().format(
                        Math.round(balanceQuery.data.availableCredits.image),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{localize('com_nav_credits_presentation')}:</span>
                    <span>
                      {new Intl.NumberFormat().format(
                        Math.round(balanceQuery.data.availableCredits.presentation),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{localize('com_nav_credits_video')}:</span>
                    <span>
                      {new Intl.NumberFormat().format(
                        Math.round(balanceQuery.data.availableCredits.video),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-token-text-secondary ml-3 mr-2 py-2 text-sm" role="note">
                {localize('com_nav_balance')}:{' '}
                {new Intl.NumberFormat().format(Math.round(balanceQuery.data.tokenCredits))}
              </div>
            )}
            <DropdownMenuSeparator />
          </>
        )}
        <Select.SelectItem
          value=""
          onClick={() => setShowFiles(true)}
          className="select-item text-sm"
        >
          <FileText className="icon-md" aria-hidden="true" />
          {localize('com_nav_my_files')}
        </Select.SelectItem>
        <Select.SelectItem
          value=""
          onClick={handleCopyReferralLink}
          className="select-item text-sm"
        >
          <Link className="icon-md" aria-hidden="true" />
          {copying ? localize('com_ui_referral_copied') : localize('com_ui_referral_copy_link')}
        </Select.SelectItem>
        {startupConfig?.helpAndFaqURL !== '/' && (
          <Select.SelectItem
            value=""
            onClick={() => window.open(startupConfig?.helpAndFaqURL, '_blank')}
            className="select-item text-sm"
          >
            <LinkIcon aria-hidden="true" />
            {localize('com_nav_help_faq')}
          </Select.SelectItem>
        )}
        <Select.SelectItem
          value=""
          onClick={() => setShowSettings(true)}
          className="select-item text-sm"
        >
          <GearIcon className="icon-md" aria-hidden="true" />
          {localize('com_nav_settings')}
        </Select.SelectItem>
        <DropdownMenuSeparator />
        <Select.SelectItem
          aria-selected={true}
          onClick={() => logout()}
          value="logout"
          className="select-item text-sm"
        >
          <LogOut className="icon-md" />
          {localize('com_nav_log_out')}
        </Select.SelectItem>
      </Select.SelectPopover>
      {showFiles && <FilesView open={showFiles} onOpenChange={setShowFiles} />}
      {showSettings && <Settings open={showSettings} onOpenChange={setShowSettings} />}
    </Select.SelectProvider>
  );
}

export default memo(AccountSettings);
