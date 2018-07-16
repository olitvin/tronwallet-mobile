import React, { Component } from 'react'
import {
  ActivityIndicator,
  Keyboard
} from 'react-native'
import { Auth } from 'aws-amplify'
import { StackActions, NavigationActions } from 'react-navigation'

// Design
import ButtonGradient from '../../components/ButtonGradient'
import * as Utils from '../../components/Utils'
import { Colors, Spacing } from '../../components/DesignSystem'
import Logo from '../../components/Logo'

// Services
import { createUserKeyPair } from '../../utils/secretsUtils'
import WalletClient from '../../services/client'
import KeyboardScreen from '../../components/KeyboardScreen'

class SignupScene extends Component {
  state = {
    code: '',
    confirmError: null,
    loadingConfirm: false
  }

  changeInput = (text, field) => {
    this.setState({
      [field]: text
    })
  }

  _createKeyPair = async () => {
    await createUserKeyPair()
  }

  _navigateNext = async username => {
    const { navigation } = this.props
    try {
      const result = await WalletClient.giftUser()
      if (result) {
        // const address = await getUserPublicKey()
        // Adapt Reward here
        const rewardsParams = {
          label: username,
          amount: 1,
          token: 'TWX'
        }
        navigation.navigate('Rewards', rewardsParams)
      } else {
        throw new Error('User already gifted')
      }
    } catch (error) {
      const navigateToHome = StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName: 'App' })],
        key: null
      })
      navigation.dispatch(navigateToHome)
    }
  }

  confirmSignup = async () => {
    const { code } = this.state
    const { navigation } = this.props
    Keyboard.dismiss()

    const username = navigation.getParam('username')
    const password = navigation.getParam('password')
    this.setState({ loadingConfirm: true })
    try {
      await Auth.confirmSignUp(username, code)
      await Auth.signIn(username, password)
      await this._createKeyPair()
      this.setState({ loadingConfirm: false })
      await this._navigateNext(username)
    } catch (error) {
      if (error.code === 'NotAuthorizedException') {
        this.setState({
          loadingConfirm: false,
          confirmError: 'Incorrect credentials, try again..'
        })
        setTimeout(() => navigation.navigate('Login'), 1500)
        return
      }
      this.setState({ confirmError: error.message, loadingConfirm: false })
    }
  }

  renderSubmitButton = () => {
    const { loadingConfirm } = this.state

    if (loadingConfirm) {
      return (
        <Utils.Content height={80} justify='center' align='center'>
          <ActivityIndicator size='small' color={Colors.primaryText} />
        </Utils.Content>
      )
    }

    return (
      <ButtonGradient
        onPress={this.confirmSignup}
        text='CONFIRM SIGN UP'
        size='medium'
      />
    )
  }

  render () {
    const { confirmError } = this.state
    return (
      <KeyboardScreen>
        <Utils.StatusBar />
        <Utils.Container
          keyboardShouldPersistTaps={'always'}
          keyboardDismissMode='interactive'
        >
          <Utils.Content justify='center' align='center'>
            <Utils.VerticalSpacer size='small' />
            <Logo />
            <Utils.VerticalSpacer size='small' />
          </Utils.Content>

          <Utils.Content>
            <Utils.Text size='xsmall'>
              We sent you an email with the verification code from
              no-reply@verificationemail.com, please check your spam folder if
              you don't find it.
            </Utils.Text>
            <Utils.VerticalSpacer size='medium' />

            <Utils.Text size='xsmall' secondary>
              EMAIL VERIFICATION CODE
            </Utils.Text>
            <Utils.FormInput
              keyboardType='numeric'
              onChangeText={text => this.changeInput(text, 'code')}
              onSubmitEditing={this.confirmSignup}
              returnKeyType={'send'}
              padding={Spacing.medium}
            />
            <Utils.VerticalSpacer size='medium' />
            {this.renderSubmitButton()}
          </Utils.Content>
          <Utils.Error>{confirmError}</Utils.Error>
          <Utils.Content justify='center' align='center'>
            <Utils.Text
              onPress={() => this.props.navigation.goBack()}
              size='small'
              font='light'
              secondary
            >
              Go back
            </Utils.Text>
          </Utils.Content>
        </Utils.Container>
      </KeyboardScreen>
    )
  }
}

export default SignupScene
