import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { WebAuthnService } from './webAuthn.service';
import { AuthChallengeDto } from './dto/login-challenge.dto';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticatePassKeyDto, UpdateWebAuthnCredentialDto, VerifyRegisterPassKeyDto } from './dto/webAuthnCredential.dto';
import { AuthVerifyDto } from './dto/login-verify.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionInterceptor } from '../../common/transaction.interceptor';
import { SudoGuard } from '../../common/guards/sudo.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags("WebAuthn")
@Controller('web-authn')
export class WebAuthnController {
    constructor(
        private readonly webAuthnService: WebAuthnService
    ) { }

    @Post('register-challenge')
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Register passkey challenge'
    })
    @ApiResponse({ status: 200, description: 'Challenge registered' })
    @ApiResponse({ status: 403, description: 'accountId does not match with accountId in sudo token' })
    @UseInterceptors(TransactionInterceptor)
    @UseGuards(SudoGuard)
    register(@Req() req: FastifyRequest) {
        return this.webAuthnService.registerPassKey(req);
    }

    @Post('verify-register')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify register passkey' })
    @UseInterceptors(TransactionInterceptor)
    @ApiResponse({ status: 403, description: "Register your passkey first" })
    @ApiResponse({ status: 403, description: "Invalid passkey" })
    @ApiResponse({ status: 200, description: 'Passkey registered. You can now use it to log in.' })
    verifyRegisterPasskey(@Body() { registrationResponse }: VerifyRegisterPassKeyDto) {
        return this.webAuthnService.verifyRegisterPasskey(registrationResponse);
    }

    @Public()
    @Post('auth-challenge')
    @ApiOperation({ summary: 'Get authentication challenge' })
    @ApiResponse({ status: 403, description: "You have not registered a passkey" })
    @ApiResponse({ status: 200, description: 'Authentication challenge generated' })
    @UseInterceptors(TransactionInterceptor)
    getAuthChallenge(@Body() dto: AuthChallengeDto) {
        return this.webAuthnService.getAuthChallenge(dto);
    }

    @Public()
    @Post('verify-login')
    @ApiOperation({ summary: 'Verify login passkey' })
    @ApiResponse({ status: 403, description: "Login your passkey first" })
    @ApiResponse({ status: 403, description: "Invalid passkey" })
    @ApiResponse({ status: 200, description: 'Passkey authenticated and will be logged in.' })
    @UseInterceptors(TransactionInterceptor)
    verifyLogin(@Body() dto: AuthVerifyDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.webAuthnService.verifyLoginPasskey(dto, req, reply);
    }

    @Post('verify-sudo')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Verify sudo passkey' })
    @ApiResponse({ status: 403, description: "You have not registered a passkey" })
    @ApiResponse({ status: 200, description: "Nothing is returned. A sudo cookie is set." })
    @UseInterceptors(TransactionInterceptor)
    verifySudoPasskey(@Body() { authenticationResponse }: AuthenticatePassKeyDto, @Res({ passthrough: true }) reply: FastifyReply) {
        return this.webAuthnService.verifySudoPasskey(authenticationResponse, reply);
    }

    @Public()
    @Post('verify-2fa')
    @ApiOperation({ summary: 'Verify 2fa passkey' })
    @ApiResponse({ status: 403, description: "Invalid Operation" })
    @ApiResponse({ status: 403, description: "Invalid Passkey" })
    @ApiResponse({ status: 200, description: "User will be logged in" })
    @UseInterceptors(TransactionInterceptor)
    verify2faPasskey(@Body() dto: AuthVerifyDto, @Res({ passthrough: true }) reply: FastifyReply, @Req() req: FastifyRequest) {
        return this.webAuthnService.verify2faPasskey(dto, reply, req);
    }

    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update credential name' })
    @ApiParam({ name: 'id', type: String, description: "Id of the credential to update" })
    @ApiResponse({ status: 200, description: 'Credential updated' })
    @ApiResponse({ status: 404, description: 'Credential not found' })
    update(@Param('id', ParseUUIDPipe) id: string, @Body() { name }: UpdateWebAuthnCredentialDto) {
        return this.webAuthnService.updateName(id, name);
    }

    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all credentials (passkeys)' })
    @ApiResponse({ status: 200, description: 'Credentials List' })
    getCredentials() {
        return this.webAuthnService.findAll();
    }

    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete credential' })
    @ApiParam({ name: 'id', type: String, description: "Id of the credential to delete" })
    @ApiResponse({ status: 200, description: 'Credential removed' })
    delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.webAuthnService.delete(id);
    }
}
