import React from 'react';
import {ScrollView, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import styles from './Styles';
import DIMENSIONS from '../../Services/Constants/DIMENSIONS';
import TextButton from '../Customs/Buttons/TextButton';
import GlobalText from '../Customs/Text';

const PrivacyPolicy = ({cancelClick, acceptClick}) => {
  const {t} = useTranslation();

  return (
    <View
      style={{
        height: DIMENSIONS.screenHeight - 200,
        width: DIMENSIONS.bannerWidth,
        marginTop: 20,
        marginBottom: -10,
      }}>
      <ScrollView style={styles.container}>
        <View style={styles.textContainer}>
          <GlobalText
            style={styles.heading}
            text={'Privacy Policy for TourKokan'}
          />
          <GlobalText
            style={styles.paragraph}
            text={`TourKokan is committed to protecting the privacy of its users. This Privacy Policy governs the manner in which TourKokan collects, uses, maintains, and discloses information collected from users (each, a "User") of the TourKokan mobile application ("App").`}
          />
          <GlobalText
            style={styles.subheading}
            text={'Information We Collect & Google Sign-In'}
          />
          <GlobalText
            style={styles.paragraph}
            text={
              'The App may collect certain personally identifiable information from Users in a variety of ways, including, but not limited to, when Users visit our App, register on the App, and in connection with other activities, services, features, or resources we make available on our App. Users may be asked for, as appropriate, name, email address, profile picture, and other relevant information. We will collect personal identification information from Users only if they voluntarily submit such information to us. Users can always refuse to supply personally identifiable information, except that it may prevent them from engaging in certain App-related activities. \n\n' +
              'If you choose to sign in to our App using Google Sign-In, we may collect personal information from your Google account, including your name, email address, and profile picture. This information is used to create and manage your account within the App and to provide you with a personalized experience. We will only collect the data you provide through the Google Sign-In process with your explicit consent. \n\n' +
              'The information collected through Google Sign-In is governed by this Privacy Policy and Google’s Privacy Policy. We do not share this information with any third-party services except as required to operate the App, comply with legal obligations, or as otherwise described in this Privacy Policy.'
            }
          />
          <GlobalText style={styles.subheading} text={'Usage Data'} />
          <GlobalText
            style={styles.paragraph}
            text={`We may also collect information that your device sends whenever you visit our App ("Usage Data"). This Usage Data may include information such as your device's Internet Protocol ("IP") address, device type, device operating system version, the pages of our App that you visit, the time and date of your visit, the time spent on those pages, and other statistics.`}
          />

          <GlobalText style={styles.subheading} text={'Location Data'} />
          <GlobalText
            style={styles.paragraph}
            text={
              'With your consent, we may collect and process information about your actual location. We use various technologies to determine location, including IP address, GPS, and other sensors that may provide information on nearby devices, Wi-Fi access points, and cell towers.'
            }
          />

          <GlobalText
            style={styles.subheading}
            text={'Cookies and Tracking Technologies'}
          />
          <GlobalText
            style={styles.paragraph}
            text={
              'We use cookies and similar tracking technologies to track the activity on our App and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your device to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our App. We will obtain your consent before using cookies, as required by applicable laws.'
            }
          />

          <GlobalText style={styles.subheading} text={'Use of Information'} />
          <GlobalText
            style={styles.paragraph}
            text={
              "TourKokan may collect and use Users' personal information for the following purposes:"
            }
          />
          <View style={styles.list}>
            <GlobalText
              style={styles.listItem}
              text={
                '• To improve customer service: Information you provide helps us respond to your customer service requests and support needs more efficiently.'
              }
            />
            <GlobalText
              style={styles.listItem}
              text={
                '• To personalize user experience: We may use information in the aggregate to understand how our Users as a group use the services and resources provided on our App.'
              }
            />
            <GlobalText
              style={styles.listItem}
              text={
                '• To improve our App: We continually strive to improve our App offerings based on the information and feedback we receive from you.'
              }
            />
            <GlobalText
              style={styles.listItem}
              text={
                '• To send periodic emails: We may use the email address to respond to inquiries, questions, and/or other requests.'
              }
            />
            <GlobalText
              style={styles.listItem}
              text={
                '• To process transactions: We may use the information Users provide about themselves when placing an order only to provide service to that order. We do not share this information with outside parties except to the extent necessary to provide the service.'
              }
            />
            <GlobalText
              style={styles.listItem}
              text={
                '• To manage user accounts: We may use the information to manage user accounts and provide a seamless experience across devices and sessions.'
              }
            />
          </View>

          <GlobalText
            style={styles.subheading}
            text={'How We Protect Your Information'}
          />
          <GlobalText
            style={styles.paragraph}
            text={
              'We adopt appropriate data collection, storage, and processing practices and security measures to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, username, password, transaction information, and data stored on our App. Sensitive and private data exchange between the App and its Users happens over a secured communication channel and is encrypted and protected with digital signatures.'
            }
          />

          <GlobalText
            style={styles.subheading}
            text={'Sharing Your Personal Information'}
          />
          <GlobalText
            style={styles.paragraph}
            text={
              "We do not sell, trade, or rent Users' personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information regarding visitors and users with our business partners, trusted affiliates, and advertisers for the purposes outlined above. We may share information with third-party service providers to help us operate our business and the App or administer activities on our behalf, such as sending out newsletters or surveys. We may share your information with these third parties for those limited purposes provided that you have given us your permission."
            }
          />

          <GlobalText style={styles.subheading} text={'Retention of Data'} />
          <GlobalText
            style={styles.paragraph}
            text={
              'We will retain your personal information only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use your personal information to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.'
            }
          />

          <GlobalText
            style={styles.subheading}
            text={'Changes to This Privacy Policy'}
          />
          <GlobalText
            style={styles.paragraph}
            text={
              'TourKokan has the discretion to update this privacy policy at any time. When we do, we will post a notification on the main page of our App, and if the changes are significant, we will notify you via email or in-app notifications. We encourage Users to frequently check this page for any changes to stay informed about how we are helping to protect the personal information we collect. You acknowledge and agree that it is your responsibility to review this privacy policy periodically and become aware of modifications.'
            }
          />

          <GlobalText
            style={styles.subheading}
            text={'Your Acceptance of These Terms'}
          />
          <GlobalText
            style={styles.paragraph}
            text={
              'By using this App, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our App. Your continued use of the App following the posting of changes to this policy will be deemed your acceptance of those changes.'
            }
          />

          <GlobalText style={styles.subheading} text={'Contact Us'} />
          <GlobalText
            style={styles.paragraph}
            text={
              'If you have any questions about this Privacy Policy, the practices of this App, or your dealings with this App, please contact us at '
            }
          />
          <GlobalText style={styles.link} text={'support@tourkokan.com.'} />
          <GlobalText
            style={styles.paragraph}
            text={'This document was last updated on 1 October 2024.'}
          />
        </View>
      </ScrollView>

      {/* <View style={styles.buttonContainer}>
        <TextButton title={t('BUTTON.ACCEPT')} onPress={acceptClick} />
        <TextButton title={t('BUTTON.CANCEL')} onPress={cancelClick} />
      </View> */}
    </View>
  );
};

export default PrivacyPolicy;
