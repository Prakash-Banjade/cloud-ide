import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBearerAuth, ApiConflictResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { RegisterDto, SignInDto } from './dto/signIn.dto';
import { AuthHelper } from './helpers/auth.helper';
import { Auth2faHelper } from './helpers/auth-2fa.helper';
import { TransformInstanceToInstance } from 'class-transformer';
import { Throttle } from '@nestjs/throttler';
import { ChangePasswordDto, EmailOnlyDto, OtpVerificationDto, ResendTwofaOtpDto, ResetPasswordDto, UpdateEmailDto, VerifySudoDto, VerifyTokenDto } from './dto/auth.dtos';
import { TransactionInterceptor } from '../../common/transaction.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/global.types';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly authHelper: AuthHelper,
        private readonly auth2faHelper: Auth2faHelper,
    ) { }

    @ApiOperation({ summary: 'Register a user' })
    @ApiConflictResponse({ description: 'User with email already exists.' })
    @UseInterceptors(TransactionInterceptor)
    @Public()
    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @ApiOperation({ summary: 'Login a user' })
    @ApiResponse({ status: 200, description: 'User successfully logged in.' })
    @ApiResponse({ status: 401, description: 'Invalid credentials.' })
    @UseInterceptors(TransactionInterceptor)
    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('login')
    login(
        @Body() signInDto: SignInDto,
        @Req() request: FastifyRequest,
        @Res({ passthrough: true }) response: FastifyReply,
    ) {
        return this.authService.login(signInDto, request, response);
    }

    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Access token refreshed successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token.' })
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    @Public()
    @Post('refresh')
    refresh(@Req() req: FastifyRequest) {
        return this.authService.refresh(req);
    }

    @ApiOperation({ summary: 'Email verification' })
    @ApiResponse({ status: 200, description: 'Email verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid OTP or verification token' })
    @UseInterceptors(TransactionInterceptor)
    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('verify-email')
    verifyEmail(@Body() otpVerificationDto: OtpVerificationDto, @Req() req: FastifyRequest) {
        return this.authService.verifyEmail(otpVerificationDto, req);
    }

    @ApiOperation({ summary: 'Verify if email verification token is still valid.' })
    @ApiResponse({ status: 200, description: 'Email is verified', schema: { example: { message: "VALID TOKEN" } } })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('check-email-verification-token')
    checkEmailVerificationToken(@Body() { token }: VerifyTokenDto) {
        return this.authService.checkEmailVerificationToken(token);
    }

    @ApiOperation({ summary: 'Logout a user' })
    @ApiResponse({ status: 200, description: 'User successfully logged out.' })
    @ApiResponse({ status: 401, description: 'Invalid session.' })
    @UseGuards(RefreshTokenGuard)
    @ApiBearerAuth()
    @Post('logout')
    logout() {
        return this.authService.logout();
    }

    @ApiOperation({ summary: 'Change the password of the authenticated user' })
    @ApiResponse({ status: 200, description: 'Password changed successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid current password.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(TransactionInterceptor)
    @ApiBearerAuth()
    @Post('change-password')
    changePassword(@Body() changePasswordDto: ChangePasswordDto, @CurrentUser() currentUser: AuthUser) {
        return this.authService.changePassword(changePasswordDto, currentUser);
    }

    @ApiOperation({ summary: 'Request password reset' })
    @ApiResponse({ status: 200, description: 'Password reset request sent successfully.' })
    @ApiResponse({ status: 404, description: 'Account not found.' })
    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(TransactionInterceptor)
    @Public()
    forgotPassword(@Body() { email }: EmailOnlyDto) {
        return this.authService.forgotPassword(email)
    }

    @ApiOperation({ summary: 'Verify password reset token' })
    @ApiResponse({ status: 200, description: 'Token is valid.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('verify-pwd-reset-token')
    verifyResetToken(@Body() verifyTokenDto: VerifyTokenDto) {
        return this.authService.verifyResetToken(verifyTokenDto.token)
    }

    @ApiOperation({ summary: 'Reset the password using token' })
    @ApiResponse({ status: 200, description: 'Password reset successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired token.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(TransactionInterceptor)
    @Public()
    @Post('reset-password')
    resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
        return this.authService.resetPassword(resetPasswordDto);
    }

    @ApiOperation({ summary: 'Update the email of the authenticated user' })
    @ApiResponse({ status: 200, description: 'Email updated successfully.' })
    @ApiResponse({ status: 500, description: 'Failed to update email. Server error.' })
    @ApiResponse({ status: 401, description: 'Unauthorized. Password is incorrect.' })
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @Post('update-email')
    updateEmail(@Body() updateEmailDto: UpdateEmailDto, @CurrentUser() currentUser: AuthUser) {
        return this.authService.updateEmail(updateEmailDto, currentUser);
    }

    @ApiOperation({ summary: 'Verify sudo access for privileged actions' })
    @ApiResponse({ status: 200, description: 'Sudo verified successfully.' })
    @ApiResponse({ status: 401, description: 'Invalid sudo credentials.' })
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @Post('verify-sudo')
    verifySudoPassword(@Body() { sudo_password }: VerifySudoDto, @Res({ passthrough: true }) res: FastifyReply) {
        return this.authHelper.verifySudoPassword(sudo_password, res);
    }

    @ApiOperation({ summary: 'Send two-factor authentication OTP' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid request.' })
    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('send-two-fa-otp')
    send2faOtp(@Body() { email }: EmailOnlyDto, @Req() req: FastifyRequest) {
        return this.auth2faHelper.send2faOtp(email, req);
    }

    @ApiOperation({ summary: 'Verify two-factor authentication OTP' })
    @ApiResponse({ status: 200, description: 'Two-factor authentication verified successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(TransformInstanceToInstance)
    @Public()
    @Post('verify-two-fa-otp')
    verify2faOtp(@Body() dto: OtpVerificationDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.auth2faHelper.verify2faOtp(dto, req, reply);
    }

    @ApiOperation({ summary: 'Resend two-factor authentication OTP' })
    @ApiResponse({ status: 200, description: 'OTP resent successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid request.' })
    @HttpCode(HttpStatus.OK)
    @UseInterceptors(TransformInstanceToInstance)
    @Throttle({ default: { limit: 1, ttl: 60000 } }) // 1 request per minute
    @Public()
    @Post('resend-two-fa-otp')
    resend2faOtp(@Body() { verificationToken }: ResendTwofaOtpDto, @Req() req: FastifyRequest) {
        return this.auth2faHelper.resend2faOtp(verificationToken, req);
    }
}
