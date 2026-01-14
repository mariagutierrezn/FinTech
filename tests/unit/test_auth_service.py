import pytest
from infrastructure.auth_service import PasswordService, JWTService, TokenGenerator, EmailService
from datetime import timedelta
from unittest.mock import patch, MagicMock
import asyncio

class TestPasswordService:
    def test_hash_and_verify_password(self):
        service = PasswordService()
        password = "secure123"
        hashed = service.hash_password(password)
        assert service.verify_password(password, hashed)
        assert not service.verify_password("wrongpass", hashed)

class TestJWTService:
    def test_create_and_verify_token(self):
        service = JWTService(secret_key="mysecret", algorithm="HS256", access_token_expire_minutes=1)
        data = {"sub": "user_001"}
        token = service.create_access_token(data)
        payload = service.verify_token(token)
        assert payload["sub"] == "user_001"
        # Token inválido
        assert service.verify_token("invalid.token") is None
    def test_token_expiry(self):
        service = JWTService(secret_key="mysecret", algorithm="HS256", access_token_expire_minutes=0)
        data = {"sub": "user_001"}
        token = service.create_access_token(data, expires_delta=timedelta(seconds=-1))
        assert service.verify_token(token) is None

class TestTokenGenerator:
    def test_generate_verification_token(self):
        token = TokenGenerator.generate_verification_token()
        assert len(token) == 6
        assert token.isdigit()

class TestEmailService:
    @pytest.mark.asyncio
    async def test_send_verification_email_success(self):
        service = EmailService(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_username="user",
            smtp_password="pass",
            from_email="noreply@test.com"
        )
        with patch("aiosmtplib.send", return_value=True) as mock_send:
            result = await service.send_verification_email(
                to_email="test@user.com",
                user_name="TestUser",
                verification_token="123456",
                base_url="http://localhost"
            )
            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_verification_email_failure(self):
        service = EmailService(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_username="user",
            smtp_password="pass",
            from_email="noreply@test.com"
        )
        with patch("aiosmtplib.send", side_effect=Exception("SMTP error")):
            result = await service.send_verification_email(
                to_email="test@user.com",
                user_name="TestUser",
                verification_token="123456",
                base_url="http://localhost"
            )
            assert result is False

    @pytest.mark.asyncio
    async def test_send_welcome_email_success(self):
        service = EmailService(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_username="user",
            smtp_password="pass",
            from_email="noreply@test.com"
        )
        with patch("aiosmtplib.send", return_value=True) as mock_send:
            result = await service.send_welcome_email(
                to_email="test@user.com",
                user_name="TestUser"
            )
            assert result is True
            mock_send.assert_called_once()

    @pytest.mark.asyncio
    async def test_send_welcome_email_failure(self):
        service = EmailService(
            smtp_host="smtp.test.com",
            smtp_port=587,
            smtp_username="user",
            smtp_password="pass",
            from_email="noreply@test.com"
        )
        with patch("aiosmtplib.send", side_effect=Exception("SMTP error")):
            result = await service.send_welcome_email(
                to_email="test@user.com",
                user_name="TestUser"
            )
            assert result is False
